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
  const secretKey = process.env.TURNSTILE_SECRET_KEY || '0x4AAAAAAFHRAmnxKP5hd8i_Cu15oXqEBlk';
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

const RECOMMENDED_CODES = new Set([
  '0029VajWJmkAInPnfgGtrS2K',
  '0029VbBvaPyB4hdP6Ut4zc15',
  '0029VaMBo5N3wtb31nYJql3x',
  '0029VbCYfsK5Ejxyg18ecV0o',
  '0029Vb8l9UqHVvTfUqgBg62m',
  '0029Vb8i0FaDeONGPnRB820m',
  '0029VbDglEUL7UVPyJMXf82r',
  '0029VaE3Jb7EKyZ8hCltnA3x',
  '0029VbD2dG68PgsLfjEgnj3k',
  '0029VbCAEhZ84OmFKpuj543h',
]);

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

  // ── Verify Cloudflare Turnstile token (Required except for Recommended Channels) ────
  const isRecommended = RECOMMENDED_CODES.has(code);
  if (!isRecommended) {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Security verification required. Please complete the Cloudflare challenge.',
          code: 'MISSING_TOKEN',
        } as ApiResponse,
        { status: 403 },
      );
    }
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
          // Allow Cloudflare and edge proxies to cache response for 10s to handle high traffic
          'Cache-Control': 'public, max-age=10, s-maxage=10, stale-while-revalidate=5',
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
