// =====================================================================
// GET /api/channel?url=https://whatsapp.com/channel/...
// Returns ChannelData or ApiError (JSON)
// =====================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { validateChannelUrl } from '@/lib/validation';
import { fetchNewsletterByInvite } from '@/lib/whatsapp';
import { mapNewsletterToChannelData } from '@/lib/channel';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import type { ApiResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  // ── Rate limiting ───────────────────────────────────────────────────────
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please slow down and try again in a minute.',
        code: 'RATE_LIMITED',
      } as ApiResponse,
      { status: 429 },
    );
  }

  // ── Extract and validate URL ────────────────────────────────────────────
  const rawUrl = request.nextUrl.searchParams.get('url') ?? request.nextUrl.searchParams.get('code') ?? '';
  const { valid, code, error: validationError } = validateChannelUrl(rawUrl);

  if (!valid || !code) {
    return NextResponse.json(
      {
        success: false,
        error: validationError ?? 'Invalid URL',
        code: rawUrl.trim() === '' ? 'MISSING_URL' : 'INVALID_URL',
      } as ApiResponse,
      { status: 400 },
    );
  }

  // ── Fetch newsletter metadata via Baileys ───────────────────────────────
  try {
    const meta = await fetchNewsletterByInvite(code);
    const channel = mapNewsletterToChannelData(meta);

    return NextResponse.json(
      { success: true, channel } as ApiResponse,
      {
        status: 200,
        headers: {
          // Prevent browsers from caching this response
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message === 'WA_NOT_CONNECTED') {
      return NextResponse.json(
        {
          success: false,
          error: 'WhatsApp is not connected yet. Please complete setup at /setup.',
          code: 'WA_NOT_CONNECTED',
        } as ApiResponse,
        { status: 503 },
      );
    }

    if (message === 'CHANNEL_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: 'Channel not found. Make sure the link is correct and the channel is public.',
          code: 'CHANNEL_NOT_FOUND',
        } as ApiResponse,
        { status: 404 },
      );
    }

    if (message === 'NETWORK_TIMEOUT') {
      return NextResponse.json(
        {
          success: false,
          error: 'Request timed out. WhatsApp is taking too long to respond.',
          code: 'NETWORK_TIMEOUT',
        } as ApiResponse,
        { status: 504 },
      );
    }

    if (message.startsWith('WA_BAILEYS_ERROR:')) {
      console.error('[API /channel] Baileys error:', message);
      return NextResponse.json(
        {
          success: false,
          error: 'WhatsApp returned an error. Please try again.',
          code: 'WA_BAILEYS_ERROR',
        } as ApiResponse,
        { status: 500 },
      );
    }

    console.error('[API /channel] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        code: 'INTERNAL_ERROR',
      } as ApiResponse,
      { status: 500 },
    );
  }
}
