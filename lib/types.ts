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
  | 'MISSING_TOKEN'
  | 'INVALID_CAPTCHA'
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

// =====================================================================
// YouTube Live Counter Types (SuperPlayCounts API)
// =====================================================================

/** Core YouTube channel data returned from /api/youtube */
export interface YouTubeChannelData {
  /** YouTube Channel ID, e.g. "UCX6OQ3DkcsbYNE6H8uQQuVA" */
  id: string;
  /** Display name of the YouTube channel */
  name: string;
  /** Real-time estimated subscriber count */
  subscribers: number;
  /** Public rounded API subscriber count */
  apiSubscribers: number;
  /** Total channel video views */
  views: number;
  /** Total uploaded videos */
  videos: number;
  /** Remaining subscribers to API goal */
  goal: number;
  /** Channel avatar URL */
  picture: string | null;
  /** Channel banner URL */
  banner: string | null;
  /** Whether the channel is verified */
  verified?: boolean;
  /** ISO timestamp of when data was fetched */
  fetchedAt: string;
}

/** Search result item from SuperPlayCounts search endpoint */
export interface YouTubeSearchItem {
  id: string;
  name: string;
  picture: string | null;
}

/** Successful YouTube channel response */
export interface YouTubeChannelResponse {
  success: true;
  channel: YouTubeChannelData;
}

/** Successful YouTube search response */
export interface YouTubeSearchResponse {
  success: true;
  results: YouTubeSearchItem[];
}

/** Union of YouTube API responses */
export type YouTubeApiResponse = YouTubeChannelResponse | YouTubeSearchResponse | ApiError;
