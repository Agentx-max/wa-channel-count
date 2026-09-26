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

export async function initWhatsApp(force = false): Promise<void> {
  const state = getState();

  // Already connected — nothing to do
  if (state.isConnected && state.socket) return;

  // If socket is already alive and waiting for authentication/pairing, DO NOT DESTROY IT!
  if (!force && state.socket && !state.isLoggedOut) {
    return;
  }

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

  // Close existing socket before opening a new one to prevent 440 Conflict errors
  if (state.socket) {
    try {
      state.socket.end(undefined);
    } catch {
      // ignore
    }
    state.socket = null;
  }

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
      browser: Browsers.ubuntu('Chrome'),
      connectTimeoutMs: 60_000,
      keepAliveIntervalMs: 25_000,
      retryRequestDelayMs: 500,
      generateHighQualityLinkPreview: false,
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

// In-memory short cache to eliminate latency and protect WA account on rapid live polling
const newsletterCache = new Map<string, { data: NewsletterMetadata; timestamp: number }>();
const newsletterInflight = new Map<string, Promise<NewsletterMetadata>>();
const CACHE_TTL_MS = 10000; // 10 seconds cache

/**
 * Resolve a newsletter invite code to metadata.
 * Uses the Baileys newsletterMetadata("invite", code) call.
 */
export async function fetchNewsletterByInvite(
  inviteCode: string,
): Promise<NewsletterMetadata> {
  let sock = getSocket();
  let status = getConnectionStatus();

  // If not connected, trigger init and wait up to 10s for connection to establish
  if (!sock || !status.connected) {
    console.log('[WA] Channel lookup requested while socket not connected. Initialising & waiting…');
    void initWhatsApp().catch((err) => console.error('[WA] Lookup init error:', err));

    const start = Date.now();
    while (Date.now() - start < 10_000) {
      status = getConnectionStatus();
      sock = getSocket();
      if (status.connected && sock) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  if (!sock || !status.connected) {
    throw new Error('WA_NOT_CONNECTED');
  }

  // Return cached result if fresh (< 10 seconds)
  const cached = newsletterCache.get(inviteCode);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Inflight promise coalescing: if a fetch for this inviteCode is already running, wait for it!
  const existingInflight = newsletterInflight.get(inviteCode);
  if (existingInflight) {
    return existingInflight;
  }

  const fetchPromise = (async () => {
    try {
      const activeSock = getSocket();
      if (!activeSock) throw new Error('WA_NOT_CONNECTED');

      const metadata = await activeSock.newsletterMetadata('invite', inviteCode);
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

      // Store in short cache (10s)
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
    } finally {
      newsletterInflight.delete(inviteCode);
    }
  })();

  newsletterInflight.set(inviteCode, fetchPromise);
  return fetchPromise;
}

export async function resetAuthSession(): Promise<void> {
  const state = getState();
  if (state.socket) {
    try {
      state.socket.end(undefined);
    } catch {
      // ignore
    }
    state.socket = null;
  }
  state.isConnected = false;
  state.isConnecting = false;
  state.qrCode = null;
  state.isLoggedOut = false;
  state.reconnectAttempts = 0;
  global.__waInitPromise = null;
  global.__waInitStartedAt = null;

  if (fs.existsSync(AUTH_DIR)) {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    console.log('[WA] Force deleted auth/ folder for fresh pairing session');
  }
}

/**
 * Request an 8-digit pairing code from WhatsApp using a phone number.
 */
export async function getPairingCode(phoneNumber: string): Promise<string> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 8) {
    throw new Error('Please enter a valid phone number with country code (e.g. 94770153179)');
  }

  const state = getState();

  // If previous session exists or socket is in bad state, reset cleanly first
  if (state.socket || fs.existsSync(AUTH_DIR)) {
    await resetAuthSession();
  }

  await initWhatsApp(true);

  // Wait up to 8 seconds for the Baileys socket to instantiate
  let sock = getSocket();
  const startTime = Date.now();
  while (Date.now() - startTime < 8000) {
    sock = getSocket();
    if (sock) {
      // Pause 1.5s for WebSocket handshake to stabilize
      await new Promise((r) => setTimeout(r, 1500));
      break;
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  if (!sock) {
    throw new Error('Failed to initialize WhatsApp connection. Please click Reset Session and try again.');
  }

  console.log(`[WA] Requesting 8-digit pairing code for number: ${cleanPhone}`);

  // Retry pairing code request up to 3 attempts (1.5s-2s delay) in case WS was still opening
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const currentSock = getSocket();
      if (!currentSock) throw new Error('Socket unavailable');
      const code = await currentSock.requestPairingCode(cleanPhone);
      if (code) {
        console.log(`[WA] Pairing code issued successfully on attempt ${attempt}: ${code}`);
        return code;
      }
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`[WA] Pairing code attempt ${attempt}/3 failed (${msg}). Retrying in 2s...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`WhatsApp pairing failed (${errMsg}). Please click Reset Session and try again.`);
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
