// =====================================================================
// Shared TypeScript types for WA Live Count
// =====================================================================

/** Core channel data returned from the WhatsApp API */
export interface ChannelData {
  /** WhatsApp newsletter JID, e.g. "120363XXXXXXXX@newsletter" */
  id: string;
  /** Display name of the channel */
  name: string;
  /** Current subscriber / follower count */
  followers: number;
  /** Channel description, if available */
  description?: string;
  /** Profile picture URL (base64 data URI or null) */
  picture: string | null;
  /** Whether the channel is officially verified */
  verified?: boolean;
  /** ISO timestamp of when data was fetched */
  fetchedAt: string;
}

/** Successful API response */
export interface ChannelResponse {
  success: true;
  channel: ChannelData;
}

/** Failed API response */
export interface ApiError {
  success: false;
  error: string;
  code?: ErrorCode;
}

/** Union of all possible API responses */
export type ApiResponse = ChannelResponse | ApiError;

/** Enum-like error codes for typed handling on the client */
export type ErrorCode =
  | 'INVALID_URL'
  | 'MISSING_URL'
  | 'INVALID_CHANNEL_CODE'
  | 'CHANNEL_NOT_FOUND'
  | 'WA_NOT_CONNECTED'
  | 'WA_AUTH_REQUIRED'
  | 'WA_BAILEYS_ERROR'
  | 'NETWORK_TIMEOUT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

/** Current WhatsApp connection status */
export interface ConnectionStatus {
  connected: boolean;
  qrAvailable: boolean;
  qrCode?: string; // base64 image data URI
  loggedOut: boolean;
  reconnecting: boolean;
}

/** Response from /api/auth/status */
export interface AuthStatusResponse {
  status: ConnectionStatus;
}
