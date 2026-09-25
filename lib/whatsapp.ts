// =====================================================================
// WhatsApp Connection Manager (Baileys singleton)
// =====================================================================
// This module maintains a SINGLE persistent Baileys socket.
// Hot reload-safe: uses global to survive Next.js dev server refreshes.
// Never expose this module or its state to the browser.
// =====================================================================

// Prevent this module from ever being bundled for the browser
import 'server-only';

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

// Global singleton – survives Next.js hot reloads AND module re-imports on cloud
/* eslint-disable no-var */
declare global {
  var __waState: WaConnectionState | undefined;
  var __waInitialised: boolean | undefined;
  var __waInitPromise: Promise<void> | null;
  var __waInitStartedAt: number | null;
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

// Use global so the promise survives module re-imports on cloud workers
if (global.__waInitPromise === undefined) global.__waInitPromise = null;
if (global.__waInitStartedAt === undefined) global.__waInitStartedAt = null;

export async function initWhatsApp(): Promise<void> {
  const state = getState();

  // Already connected — nothing to do
  if (state.isConnected && state.socket) return;

  // If logged out, reset first so we can get a fresh QR
  if (state.isLoggedOut) {
    console.log('[WA] Previously logged out — resetting for fresh auth');
    state.isLoggedOut = false;
    state.isConnecting = false;
    state.socket = null;
    state.qrCode = null;
    state.reconnectAttempts = 0;
    global.__waInitPromise = null;
    global.__waInitStartedAt = null;
    // Wipe stale credentials so WhatsApp shows a fresh QR
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      console.log('[WA] Deleted stale auth/ folder');
    }
  }

  // If stuck connecting for more than 90s, force a reset
  if (
    state.isConnecting &&
    global.__waInitStartedAt &&
    Date.now() - global.__waInitStartedAt > 90_000
  ) {
    console.log('[WA] Init stuck for >90s — resetting state and retrying');
    state.isConnecting = false;
    state.socket = null;
    global.__waInitPromise = null;
    global.__waInitStartedAt = null;
  }

  // Return ongoing init if already in progress
  if (global.__waInitPromise) return global.__waInitPromise;

  global.__waInitStartedAt = Date.now();
  global.__waInitPromise = _doInit().finally(() => {
    global.__waInitPromise = null;
    global.__waInitStartedAt = null;
  });

  return global.__waInitPromise;
}

async function restoreAuthFromEnv() {
  const backup = process.env.WA_AUTH_BACKUP;
  if (!backup) return;

  try {
    const data = JSON.parse(Buffer.from(backup, 'base64').toString('utf-8')) as Record<string, unknown>;

    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    // Write each file from the backup to the auth directory
    for (const [filename, content] of Object.entries(data)) {
      const filepath = path.join(AUTH_DIR, filename);
      fs.writeFileSync(
        filepath,
        typeof content === 'string' ? content : JSON.stringify(content),
        'utf-8',
      );
    }
    console.log(`[WA] Auth restored from WA_AUTH_BACKUP (${Object.keys(data).length} files)`);
  } catch (err) {
    console.error('[WA] Failed to restore auth from WA_AUTH_BACKUP env var:', err);
  }
}

async function _doInit(): Promise<void> {
  const state = getState();

  // Guard handled by initWhatsApp — just mark connecting
  state.isConnecting = true;
  state.qrCode = null;

  // Restore credentials from environment variable (for cloud deployments)
  await restoreAuthFromEnv();

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
      browser: Browsers.macOS('Safari'),
      connectTimeoutMs: 60_000,
      keepAliveIntervalMs: 25_000,
      retryRequestDelayMs: 500,
      generateHighQualityLinkPreview: false,
      shouldIgnoreJid: () => true, // don't process any messages
      markOnlineOnConnect: false,
      syncFullHistory: false,
      // Suppress Baileys message-history requests
      getMessage: async () => undefined,
    });

    state.socket = sock;

    // ── QR code & Connection Updates ───────────────────────────────────────
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
        console.log('[WA] Connected successfully! ✓ Session active.');
      }

      if (connection === 'close') {
        state.isConnected = false;
        state.isConnecting = false;

        const { Boom } = await import('@hapi/boom');
        const error = lastDisconnect?.error;
        const statusCode =
          error instanceof Boom
            ? error.output.statusCode
            : (error as any)?.output?.statusCode || 0;

        console.log(`[WA] Connection closed. Status code: ${statusCode}, Error:`, error?.message || error);

        // Only treat 401 as permanent logout if the user was already registered/logged in
        const isRegisteredUser = Boolean(authState.creds.registered || authState.creds.me?.id);
        const loggedOut = statusCode === DisconnectReason.loggedOut && isRegisteredUser;

        if (loggedOut) {
          console.log('[WA] Session logged out by WhatsApp (401) — clearing auth');
          state.isLoggedOut = true;
          state.isConnected = false;
          state.isConnecting = false;
          state.qrCode = null;
          state.socket = null;
          global.__waInitPromise = null;
          global.__waInitStartedAt = null;

          // Auto-delete stale credentials
          if (fs.existsSync(AUTH_DIR)) {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            console.log('[WA] Deleted stale auth/ folder');
          }
          return;
        }

        // Exponential back-off reconnect
        if (state.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          state.reconnectAttempts += 1;
          const delay = RECONNECT_DELAY_MS * state.reconnectAttempts;
          console.log(
            `[WA] Reconnecting in ${delay}ms… (attempt ${state.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`,
          );
          setTimeout(() => {
            void _doInit();
          }, delay);
        } else {
          console.error(
            '[WA] Max reconnect attempts reached (5/5). Call initWhatsApp() again to retry.',
          );
          // Reset reconnectAttempts counter so future user actions can try again
          state.reconnectAttempts = 0;
        }
      }
    });

    // ── Save credentials when they change ─────────────────────────────────
    sock.ev.on('creds.update', async (creds) => {
      console.log('[WA] Credentials updated & saved to auth/');
      if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
      }
      await saveCreds();
    });

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

/**
 * Request an 8-digit pairing code from WhatsApp using a phone number.
 */
export async function getPairingCode(phoneNumber: string): Promise<string> {
  const state = getState();
  if (state.isConnected) {
    throw new Error('WhatsApp is already connected! Refresh the page.');
  }

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 8) {
    throw new Error('Please enter a valid phone number with country code (e.g. 94712345678 or 1234567890)');
  }

  let sock = getSocket();
  if (!sock || state.isLoggedOut) {
    state.isLoggedOut = false;
    await initWhatsApp();
    sock = getSocket();
  }
  if (!sock) {
    throw new Error('FAILED_TO_INIT_SOCKET');
  }

  console.log(`[WA] Requesting 8-digit pairing code for number: ${cleanPhone}`);
  const code = await sock.requestPairingCode(cleanPhone);
  console.log(`[WA] Pairing code issued successfully: ${code}`);
  return code;
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
