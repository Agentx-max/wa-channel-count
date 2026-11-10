// =====================================================================
// YouTube Channel Tracker logic — powered by SuperPlayCounts API
// Docs: https://superplaycounts.github.io/api/docs.html
// Base URL: https://api.superplaycounts.pp.ua/
// =====================================================================

import type { YouTubeChannelData, YouTubeSearchItem } from './types';

const SUPERPLAYCOUNTS_BASE_URL = 'https://api.superplaycounts.pp.ua';

// Short-lived cache for live counter polling (2.5 seconds)
const CHANNEL_CACHE_TTL_MS = 2500;
// Longer cache for search queries (30 seconds)
const SEARCH_CACHE_TTL_MS = 30_000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const channelCache = new Map<string, CacheEntry<YouTubeChannelData>>();
const searchCache = new Map<string, CacheEntry<YouTubeSearchItem[]>>();
const inflightChannelRequests = new Map<string, Promise<YouTubeChannelData>>();

/**
 * Check if a string is a direct YouTube Channel ID (starts with UC and is 24 chars).
 */
export function isYouTubeChannelId(input: string): boolean {
  return /^UC[A-Za-z0-9_-]{22}$/.test(input.trim());
}

/**
 * Parse user input (URL, @handle, Channel ID, or search keyword)
 * into either a direct Channel ID or a search query.
 */
export function parseYouTubeInput(rawInput: string): {
  valid: boolean;
  type: 'id' | 'search';
  value: string;
  error: string | null;
} {
  if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
    return {
      valid: false,
      type: 'search',
      value: '',
      error: 'Please enter a YouTube channel link, @handle, ID, or channel name.',
    };
  }

  const trimmed = rawInput.trim();

  // 1. Direct Channel ID (e.g. UCX6OQ3DkcsbYNE6H8uQQuVA)
  if (isYouTubeChannelId(trimmed)) {
    return { valid: true, type: 'id', value: trimmed, error: null };
  }

  // 2. Check if it looks like a URL
  if (/^https?:\/\//i.test(trimmed) || /^(?:www\.|m\.)?youtube\.com\//i.test(trimmed) || /^youtu\.be\//i.test(trimmed)) {
    try {
      const normalizedUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      const parsed = new URL(normalizedUrl);
      const host = parsed.hostname.toLowerCase();

      if (!host.includes('youtube.com') && !host.includes('youtu.be')) {
        return {
          valid: false,
          type: 'search',
          value: '',
          error: 'Please provide a valid YouTube channel link, @handle, or channel name.',
        };
      }

      const pathParts = parsed.pathname.split('/').filter(Boolean);

      if (pathParts.length === 0) {
        return {
          valid: false,
          type: 'search',
          value: '',
          error: 'Please provide a specific YouTube channel link or @handle.',
        };
      }

      // https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA
      if (pathParts[0] === 'channel' && pathParts[1]) {
        const idCandidate = pathParts[1].trim();
        if (isYouTubeChannelId(idCandidate)) {
          return { valid: true, type: 'id', value: idCandidate, error: null };
        }
        return { valid: true, type: 'search', value: idCandidate, error: null };
      }

      // https://www.youtube.com/@MrBeast
      if (pathParts[0].startsWith('@')) {
        return {
          valid: true,
          type: 'search',
          value: decodeURIComponent(pathParts[0]),
          error: null,
        };
      }

      // https://www.youtube.com/c/ChannelName or /user/UserName
      if ((pathParts[0] === 'c' || pathParts[0] === 'user') && pathParts[1]) {
        return {
          valid: true,
          type: 'search',
          value: decodeURIComponent(pathParts[1]),
          error: null,
        };
      }

      // Other path segments (e.g. youtube.com/MrBeast)
      const reserved = new Set(['watch', 'shorts', 'playlist', 'feed', 'results', 'gaming']);
      if (!reserved.has(pathParts[0].toLowerCase())) {
        return {
          valid: true,
          type: 'search',
          value: decodeURIComponent(pathParts[0]),
          error: null,
        };
      }

      return {
        valid: false,
        type: 'search',
        value: '',
        error: 'Please enter a YouTube channel link (not a video link) or search by channel name.',
      };
    } catch {
      return {
        valid: false,
        type: 'search',
        value: '',
        error: 'Invalid YouTube URL format.',
      };
    }
  }

  // 3. Otherwise treat as @handle or channel search keyword
  if (trimmed.length < 2) {
    return {
      valid: false,
      type: 'search',
      value: '',
      error: 'Please enter at least 2 characters to search for a YouTube channel.',
    };
  }

  return { valid: true, type: 'search', value: trimmed, error: null };
}

/**
 * Search YouTube channels via SuperPlayCounts API:
 * GET https://api.superplaycounts.pp.ua/api/youtube-channel-counter/search/:query
 */
export async function searchYouTubeChannels(query: string): Promise<YouTubeSearchItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const cacheKey = cleanQuery.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL_MS) {
    return cached.data;
  }

  const endpoint = `${SUPERPLAYCOUNTS_BASE_URL}/api/youtube-channel-counter/search/${encodeURIComponent(cleanQuery)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'WACount-YouTube-Tracker/1.0 (https://wacount.com/yt)',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`SUPERPLAY_SEARCH_HTTP_${res.status}`);
    }

    const data = await res.json();
    const list = Array.isArray(data?.list) ? data.list : [];

    const results: YouTubeSearchItem[] = [];
    for (const item of list) {
      if (Array.isArray(item) && item.length >= 3) {
        const name = typeof item[0] === 'string' ? item[0].trim() : '';
        const picture = typeof item[1] === 'string' && item[1].trim() ? item[1].trim() : null;
        const id = typeof item[2] === 'string' ? item[2].trim() : '';
        if (id && name) {
          results.push({ id, name, picture });
        }
      }
    }

    searchCache.set(cacheKey, { data: results, timestamp: Date.now() });
    return results;
  } finally {
    clearTimeout(timeout);
  }
}

function parseNumericMetric(val: unknown): number {
  if (typeof val === 'number' && !isNaN(val)) return Math.max(0, Math.floor(val));
  if (typeof val === 'string') {
    const parsed = parseInt(val.replace(/[^0-9-]/g, ''), 10);
    if (!isNaN(parsed)) return Math.max(0, parsed);
  }
  return 0;
}

/**
 * Fetch detailed real-time YouTube channel statistics by Channel ID:
 * GET https://api.superplaycounts.pp.ua/api/youtube-channel-counter/user/:id
 */
export async function fetchYouTubeChannelById(
  channelId: string,
  fallbackAvatar: string | null = null,
  fallbackName: string | null = null
): Promise<YouTubeChannelData> {
  const cleanId = channelId.trim();
  const now = Date.now();

  const cached = channelCache.get(cleanId);
  if (cached && now - cached.timestamp < CHANNEL_CACHE_TTL_MS) {
    return cached.data;
  }

  const inflight = inflightChannelRequests.get(cleanId);
  if (inflight) {
    return inflight;
  }

  const fetchPromise = (async (): Promise<YouTubeChannelData> => {
    const endpoint = `${SUPERPLAYCOUNTS_BASE_URL}/api/youtube-channel-counter/user/${encodeURIComponent(cleanId)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'WACount-YouTube-Tracker/1.0 (https://wacount.com/yt)',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        if (res.status === 404 || res.status === 500) {
          throw new Error('CHANNEL_NOT_FOUND');
        }
        throw new Error(`SUPERPLAY_USER_HTTP_${res.status}`);
      }

      const raw = await res.json();
      const statBlock = Array.isArray(raw?.statistics) ? raw.statistics[0] : raw;
      const countsArr: Array<{ value?: string; count?: unknown }> = Array.isArray(statBlock?.counts)
        ? statBlock.counts
        : [];
      const userArr: Array<{ value?: string; count?: unknown }> = Array.isArray(statBlock?.user)
        ? statBlock.user
        : [];
      const ytStudioItem = Array.isArray(raw?.ytstudio) ? raw.ytstudio[0] : null;

      const getCount = (key: string): unknown =>
        countsArr.find((c) => c?.value === key)?.count;
      const getUserField = (key: string): string | null => {
        const found = userArr.find((u) => u?.value === key)?.count;
        return typeof found === 'string' && found.trim() ? found.trim() : null;
      };

      const name = getUserField('name') || fallbackName || null;
      const rawSubs = getCount('subscribers');
      const rawApiSubs = getCount('apisubscribers');
      const rawStudioSubs = ytStudioItem?.count;

      if (!name && rawSubs === undefined && rawApiSubs === undefined) {
        throw new Error('CHANNEL_NOT_FOUND');
      }

      const subscribers =
        rawSubs !== undefined && rawSubs !== null
          ? parseNumericMetric(rawSubs)
          : rawStudioSubs !== undefined && rawStudioSubs !== null
            ? parseNumericMetric(rawStudioSubs)
            : parseNumericMetric(rawApiSubs);

      const apiSubscribers =
        rawApiSubs !== undefined && rawApiSubs !== null
          ? parseNumericMetric(rawApiSubs)
          : subscribers;

      const views =
        getCount('views') !== undefined
          ? parseNumericMetric(getCount('views'))
          : parseNumericMetric(getCount('apiviews'));

      const videos = parseNumericMetric(getCount('videos'));
      const goal = parseNumericMetric(getCount('goal'));

      const pfp = getUserField('pfp') || fallbackAvatar || `https://www.banner.yt/${cleanId}/avatar`;
      const banner = getUserField('banner') || `https://www.banner.yt/${cleanId}`;
      const verified = Boolean(
        ytStudioItem?.verified || apiSubscribers >= 100_000 || subscribers >= 100_000
      );

      const channelData: YouTubeChannelData = {
        id: cleanId,
        name: name || 'YouTube Channel',
        subscribers,
        apiSubscribers,
        views,
        videos,
        goal,
        picture: pfp,
        banner,
        verified,
        fetchedAt: new Date().toISOString(),
      };

      channelCache.set(cleanId, { data: channelData, timestamp: Date.now() });
      return channelData;
    } catch (err) {
      // If upstream temporarily blips during live polling, return recent cached data if available
      if (cached && Date.now() - cached.timestamp < 60_000) {
        return {
          ...cached.data,
          fetchedAt: new Date().toISOString(),
        };
      }
      throw err;
    } finally {
      clearTimeout(timeout);
      inflightChannelRequests.delete(cleanId);
    }
  })();

  inflightChannelRequests.set(cleanId, fetchPromise);
  return fetchPromise;
}

/**
 * Resolve any YouTube input (URL, @handle, Channel ID, or name)
 * into live YouTubeChannelData.
 */
export async function resolveAndFetchYouTubeChannel(input: string): Promise<YouTubeChannelData> {
  const parsed = parseYouTubeInput(input);
  if (!parsed.valid) {
    throw new Error(parsed.error || 'INVALID_URL');
  }

  if (parsed.type === 'id') {
    return fetchYouTubeChannelById(parsed.value);
  }

  // Search by handle or channel name
  const searchResults = await searchYouTubeChannels(parsed.value);
  if (!searchResults || searchResults.length === 0) {
    throw new Error('CHANNEL_NOT_FOUND');
  }

  const topMatch = searchResults[0];
  return fetchYouTubeChannelById(topMatch.id, topMatch.picture, topMatch.name);
}

