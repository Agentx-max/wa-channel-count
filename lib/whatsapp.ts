// =====================================================================
// WhatsApp Connection Manager (Baileys singleton)
// =====================================================================
// This module maintains a SINGLE persistent Baileys socket.
// Hot reload-safe: uses global to survive Next.js dev server refreshes.
// Never expose this module or its state to the browser.
// =====================================================================

import path from 'path';
import fs from 'fs';
import type {
  WASocket,
  ConnectionState,
  NewsletterMetadata,
} from '@whiskeysockets/baileys';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WaConnectionState {
  socket: WASocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  qrCode: string | null;
  isLoggedOut: boolean;
  reconnectAttempts: number;
}

// Global singleton – survives Next.js hot reloads
/* eslint-disable no-var */
declare global {
  var __waState: WaConnectionState | undefined;
  var __waInitialised: boolean | undefined;
}
/* eslint-enable no-var */

const AUTH_DIR = path.resolve(process.cwd(), 'auth');
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 3000;

function getState(): WaConnectionState {
  if (!global.__waState) {
    global.__waState = {
      socket: null,
      isConnected: false,
      isConnecting: false,
      qrCode: null,
      isLoggedOut: false,
      reconnectAttempts: 0,
    };
  }
  return global.__waState;
}

// ---------------------------------------------------------------------------
// Initialise
// ---------------------------------------------------------------------------

let initPromise: Promise<void> | null = null;

export async function initWhatsApp(): Promise<void> {
  // Return ongoing init if already in progress
  if (initPromise) return initPromise;

  const state = getState();

  // Already connected
  if (state.isConnected && state.socket) return;

  initPromise = _doInit().finally(() => {
    initPromise = null;
  });

  return initPromise;
}

async function _doInit(): Promise<void> {
  const state = getState();

  if (state.isConnecting) return;
  state.isConnecting = true;
  state.qrCode = null;

  // Ensure auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  try {
    // Dynamic import keeps Baileys fully server-side
    const {
      default: makeWASocket,
      useMultiFileAuthState,
      DisconnectReason,
      Browsers,
      makeCacheableSignalKeyStore,
      fetchLatestBaileysVersion,
    } = await import('@whiskeysockets/baileys');

    const pino = (await import('pino')).default;
    const logger = pino({ level: 'silent' });

    // eslint-disable-next-line react-hooks/rules-of-hooks -- useMultiFileAuthState is a Baileys utility, not a React hook
    const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    let version: [number, number, number] = [2, 3000, 1015901307];
    try {
      const v = await Promise.race([
        fetchLatestBaileysVersion(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Version fetch timeout')), 3000),
        ),
      ]);
      version = v.version;
    } catch {
      console.log('[WA] Using default Baileys version fallback');
    }

    const sock = makeWASocket({
      version,
      auth: {
        creds: authState.creds,
        keys: makeCacheableSignalKeyStore(authState.keys, logger),
      },
      logger,
      browser: Browsers.ubuntu('Chrome'),
      printQRInTerminal: true,
      connectTimeoutMs: 30_000,
      keepAliveIntervalMs: 25_000,
      retryRequestDelayMs: 250,
      generateHighQualityLinkPreview: false,
      shouldIgnoreJid: () => true, // don't process any messages
      markOnlineOnConnect: false,
    });

    state.socket = sock;

    // ── QR code ────────────────────────────────────────────────────────────
    sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const QRCode = await import('qrcode');
          const dataUri = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
          state.qrCode = dataUri;
          state.isConnected = false;
          console.log('[WA] QR code ready — open /setup to scan');
        } catch {
          console.error('[WA] Failed to generate QR image');
        }
      }

      if (connection === 'open') {
        state.isConnected = true;
        state.isConnecting = false;
        state.qrCode = null;
        state.isLoggedOut = false;
        state.reconnectAttempts = 0;
        console.log('[WA] Connected ✓');
      }

      if (connection === 'close') {
        state.isConnected = false;
        state.isConnecting = false;

        const { Boom } = await import('@hapi/boom');
        const reason =
          lastDisconnect?.error instanceof Boom
            ? lastDisconnect.error.output.statusCode
            : 0;

        const loggedOut = reason === DisconnectReason.loggedOut;

        if (loggedOut) {
          state.isLoggedOut = true;
          state.socket = null;
          console.log('[WA] Logged out. Delete ./auth and restart to re-authenticate.');
          return;
        }

        // Exponential back-off reconnect
        if (state.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          state.reconnectAttempts += 1;
          const delay = RECONNECT_DELAY_MS * state.reconnectAttempts;
          console.log(
            `[WA] Connection closed (reason ${reason}). Reconnecting in ${delay}ms… (attempt ${state.reconnectAttempts})`,
          );
          setTimeout(() => {
            void _doInit();
          }, delay);
        } else {
          console.error(
            '[WA] Max reconnect attempts reached. Please restart the server.',
          );
        }
      }
    });

    // ── Save credentials when they change ─────────────────────────────────
    sock.ev.on('creds.update', saveCreds);

    state.isConnecting = false;
  } catch (err) {
    state.isConnecting = false;
    console.error('[WA] Failed to initialise socket:', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------

export function getSocket(): WASocket | null {
  return getState().socket;
}

export function getConnectionStatus() {
  const s = getState();
  return {
    connected: s.isConnected,
    qrAvailable: !!s.qrCode,
    qrCode: s.qrCode ?? undefined,
    loggedOut: s.isLoggedOut,
    reconnecting: s.isConnecting,
  };
}

// ---------------------------------------------------------------------------
// Channel / Newsletter helpers
// ---------------------------------------------------------------------------

// In-memory short cache to eliminate latency on rapid live polling
const newsletterCache = new Map<string, { data: NewsletterMetadata; timestamp: number }>();
const CACHE_TTL_MS = 3000; // 3 seconds cache

/**
 * Resolve a newsletter invite code to metadata.
 * Uses the Baileys newsletterMetadata("invite", code) call.
 */
export async function fetchNewsletterByInvite(
  inviteCode: string,
): Promise<NewsletterMetadata> {
  const sock = getSocket();
  const status = getConnectionStatus();
  if (!sock || !status.connected) {
    throw new Error('WA_NOT_CONNECTED');
  }

  // Return cached result if fresh (< 3 seconds)
  const cached = newsletterCache.get(inviteCode);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const metadata = await sock.newsletterMetadata('invite', inviteCode);
    if (!metadata) {
      throw new Error('CHANNEL_NOT_FOUND');
    }

    // Instantly extract directPath for profile picture without blocking network calls
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = metadata as any;
    const directPath =
      raw.picture?.directPath ||
      raw.picture?.direct_path ||
      raw.thread_metadata?.picture?.direct_path ||
      raw.thread_metadata?.preview?.direct_path ||
      raw.threadMetadata?.picture?.direct_path ||
      raw.threadMetadata?.preview?.direct_path;

    if (directPath && typeof directPath === 'string') {
      const cdnUrl = directPath.startsWith('/')
        ? `https://pps.whatsapp.net${directPath}`
        : directPath;
      if (!metadata.picture) {
        metadata.picture = { url: cdnUrl };
      } else {
        metadata.picture.url = cdnUrl;
      }
    }

    // Store in short cache
    newsletterCache.set(inviteCode, { data: metadata, timestamp: Date.now() });

    return metadata;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('not-found') || message.includes('404')) {
      throw new Error('CHANNEL_NOT_FOUND');
    }
    if (message.includes('timed out') || message.includes('timeout')) {
      throw new Error('NETWORK_TIMEOUT');
    }

    throw new Error(`WA_BAILEYS_ERROR: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Auto-init on first import (server startup)
// ---------------------------------------------------------------------------

if (!global.__waInitialised) {
  global.__waInitialised = true;
  void initWhatsApp().catch((err) => {
    console.error('[WA] Auto-init failed:', err);
  });
}
