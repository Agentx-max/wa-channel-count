// =====================================================================
// GET /api/channel?url=https://whatsapp.com/channel/...&token=...
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

async function verifyTurnstileToken(token: string, remoteIp: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    // If no secret key is configured, pass validation so the counter continues working
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
    console.error('[Turnstile Server] Verification error:', err);
    return true; // Fallback: allow request if Cloudflare itself is unreachable
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  // ── Rate limiting ───────────────────────────────────────────────────────
  const ip = getClientIp(request);
  if (!checkRateLimit(ip, 120, 60_000)) {
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

  // ── Verify Cloudflare Turnstile token (If token is provided) ────────────────────
  const token = request.nextUrl.searchParams.get('token');
  if (token) {
    const isValidCaptcha = await verifyTurnstileToken(token, ip);
    if (!isValidCaptcha) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cloudflare verification failed. Please try again.',
          code: 'INVALID_CAPTCHA',
        } as ApiResponse,
        { status: 403 },
      );
    }
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
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
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
