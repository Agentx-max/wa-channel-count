// =====================================================================
// Channel business logic — maps Baileys NewsletterMetadata → ChannelData
// =====================================================================

import type { NewsletterMetadata } from '@whiskeysockets/baileys';
import type { ChannelData } from './types';

/**
 * Transform raw Baileys NewsletterMetadata into safe ChannelData.
 * Only safe fields are included — no credentials, keys, or session data.
 *
 * NewsletterMetadata shape (from installed Baileys types):
 *   id: string
 *   name: string
 *   description?: string
 *   subscribers?: number          ← subscriber count
 *   picture?: { url?, directPath?, mediaKey?, id? }  ← NOT a string
 */
export function mapNewsletterToChannelData(meta: NewsletterMetadata): ChannelData {
  // Baileys response can structure metadata either at top-level or inside thread_metadata/threadMetadata
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = meta as any;

  // Log raw object in dev for debugging structure
  console.log('[Channel Mapper] Raw metadata:', JSON.stringify(meta, null, 2));

  // 1. Extract Name
  let name = 'WhatsApp Channel';
  if (typeof raw.name === 'string' && raw.name.trim()) {
    name = raw.name.trim();
  } else if (typeof raw.name?.text === 'string' && raw.name.text.trim()) {
    name = raw.name.text.trim();
  } else if (typeof raw.thread_metadata?.name?.text === 'string' && raw.thread_metadata.name.text.trim()) {
    name = raw.thread_metadata.name.text.trim();
  } else if (typeof raw.thread_metadata?.name === 'string' && raw.thread_metadata.name.trim()) {
    name = raw.thread_metadata.name.trim();
  } else if (typeof raw.threadMetadata?.name?.text === 'string' && raw.threadMetadata.name.text.trim()) {
    name = raw.threadMetadata.name.text.trim();
  } else if (typeof raw.threadMetadata?.name === 'string' && raw.threadMetadata.name.trim()) {
    name = raw.threadMetadata.name.trim();
  }

  // 2. Extract Followers / Subscribers Count
  let followers = 0;
  const rawSubscribers =
    raw.subscribers ??
    raw.subscribers_count ??
    raw.subscribersCount ??
    raw.thread_metadata?.subscribers_count ??
    raw.thread_metadata?.subscribers ??
    raw.threadMetadata?.subscribers_count ??
    raw.threadMetadata?.subscribers;

  if (typeof rawSubscribers === 'number' && !isNaN(rawSubscribers)) {
    followers = rawSubscribers;
  } else if (typeof rawSubscribers === 'string') {
    const parsed = parseInt(rawSubscribers, 10);
    if (!isNaN(parsed)) {
      followers = parsed;
    }
  }

  // 3. Extract Description
  let description: string | undefined = undefined;
  if (typeof raw.description === 'string' && raw.description.trim()) {
    description = raw.description.trim();
  } else if (typeof raw.description?.text === 'string' && raw.description.text.trim()) {
    description = raw.description.text.trim();
  } else if (typeof raw.thread_metadata?.description?.text === 'string' && raw.thread_metadata.description.text.trim()) {
    description = raw.thread_metadata.description.text.trim();
  } else if (typeof raw.thread_metadata?.description === 'string' && raw.thread_metadata.description.trim()) {
    description = raw.thread_metadata.description.trim();
  }

  // 4. Extract Picture URL
  let pictureUrl: string | null = null;
  const rawPic =
    raw.picture?.url ||
    raw.picture?.directPath ||
    raw.picture?.direct_path ||
    raw.thread_metadata?.picture?.url ||
    raw.thread_metadata?.picture?.direct_path ||
    raw.thread_metadata?.preview?.url ||
    raw.thread_metadata?.preview?.direct_path ||
    raw.threadMetadata?.picture?.direct_path ||
    raw.threadMetadata?.preview?.direct_path;

  if (typeof rawPic === 'string' && rawPic.trim()) {
    if (rawPic.startsWith('http://') || rawPic.startsWith('https://')) {
      pictureUrl = rawPic.trim();
    } else if (rawPic.startsWith('/')) {
      pictureUrl = `https://pps.whatsapp.net${rawPic.trim()}`;
    }
  }

  // 5. Extract Verification
  const verification =
    raw.verification ??
    raw.thread_metadata?.verification ??
    raw.threadMetadata?.verification;
  const verified = verification === 'VERIFIED';

  return {
    id: raw.id || 'unknown-id',
    name,
    followers,
    description,
    picture: pictureUrl,
    verified,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Format a follower count as a human-readable string.
 * 4238 → "4,238"
 * 1200000 → "1,200,000"
 */
export function formatFollowerCount(count: number): string {
  return count.toLocaleString('en-US');
}
