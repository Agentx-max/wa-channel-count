// =====================================================================
// GET /api/youtube?url=...&id=...&q=...&token=...
// Returns YouTubeChannelData, YouTubeSearchItem[], or ApiError (JSON)
// =====================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  parseYouTubeInput,
  fetchYouTubeChannelById,
  resolveAndFetchYouTubeChannel,
  searchYouTubeChannels,
  isYouTubeChannelId,
} from '@/lib/youtube';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import type { YouTubeApiResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function verifyTurnstileToken(token: string, remoteIp: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    return true;
  }
  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    formData.append('remoteip', remoteIp);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('[Turnstile YT Server] Verification error:', err);
    return true;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<YouTubeApiResponse>> {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip, 150, 60_000)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please slow down and try again in a minute.',
        code: 'RATE_LIMITED',
      },
      { status: 429 }
    );
  }

  const action = request.nextUrl.searchParams.get('action');

  // ── 1. Search mode: GET /api/youtube?action=search&q=... ────────────────
  if (action === 'search') {
    const q = request.nextUrl.searchParams.get('q') ?? '';
    if (!q.trim() || q.trim().length < 2) {
      return NextResponse.json({ success: true, results: [] }, { status: 200 });
    }
    try {
      const results = await searchYouTubeChannels(q.trim());
      return NextResponse.json(
        { success: true, results },
        {
          status: 200,
          headers: { 'Cache-Control': 'private, max-age=15' },
        }
      );
    } catch (err) {
      console.error('[API /youtube search] Error:', err);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to search YouTube channels. Please try again.',
          code: 'INTERNAL_ERROR',
        },
        { status: 500 }
      );
    }
  }

  // ── 2. Channel stats mode: GET /api/youtube?id=... or ?url=... ──────────
  const directId = request.nextUrl.searchParams.get('id') ?? '';
  const rawUrl = request.nextUrl.searchParams.get('url') ?? directId;

  const parsed = parseYouTubeInput(rawUrl);
  if (!parsed.valid) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error ?? 'Invalid YouTube channel input.',
        code: rawUrl.trim() === '' ? 'MISSING_URL' : 'INVALID_URL',
      },
      { status: 400 }
    );
  }

  // Verify Cloudflare Turnstile token if provided
  const token = request.nextUrl.searchParams.get('token');
  if (token) {
    const isValidCaptcha = await verifyTurnstileToken(token, ip);
    if (!isValidCaptcha) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cloudflare verification failed. Please try again.',
          code: 'INVALID_CAPTCHA',
        },
        { status: 403 }
      );
    }
  }

  try {
    const channel =
      directId && isYouTubeChannelId(directId)
        ? await fetchYouTubeChannelById(directId)
        : await resolveAndFetchYouTubeChannel(rawUrl);

    return NextResponse.json(
      { success: true, channel },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message === 'CHANNEL_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error:
            'YouTube channel not found. Make sure the link, @handle, or channel name is correct.',
          code: 'CHANNEL_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (message.includes('AbortError') || message === 'NETWORK_TIMEOUT') {
      return NextResponse.json(
        {
          success: false,
          error: 'Request timed out while contacting the YouTube counter API.',
          code: 'NETWORK_TIMEOUT',
        },
        { status: 504 }
      );
    }

    console.error('[API /youtube] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to fetch YouTube channel data right now. Please try again.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

