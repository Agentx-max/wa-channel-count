import type { Metadata } from 'next';
import Link from 'next/link';
import YouTubeCard from '@/components/YouTubeCard';
import RecommendedYouTubeChannels from '@/components/RecommendedYouTubeChannels';
import UpdatesBell from '@/components/UpdatesBell';

export const metadata: Metadata = {
  title: 'YouTube Live Count – Live YouTube Subscriber Counter',
  description:
    'Track any YouTube Channel\'s live subscriber, view, and video count in real time on wacount.com/yt. Instant, accurate, and free YouTube Channel analytics.',
  alternates: {
    canonical: 'https://wacount.com/yt',
  },
  openGraph: {
    type: 'website',
    url: 'https://wacount.com/yt',
    title: 'YouTube Live Count – Live YouTube Subscriber Counter',
    description:
      'Track real-time live subscriber, view, and video counts for any YouTube Channel.',
    siteName: 'WA Live Count',
  },
};

interface YTPageProps {
  searchParams: Promise<{ url?: string; id?: string }>;
}

export default async function YouTubeTrackerPage({ searchParams }: YTPageProps) {
  const params = await searchParams;
  const prefilledQuery = params.id || params.url;

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '32px 16px 20px',
        background:
          'radial-gradient(ellipse 100% 60% at 50% -20%, rgba(255, 0, 51, 0.14) 0%, transparent 75%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top-corner Updates & Features Bell (Red Theme) */}
      <UpdatesBell theme="red" />

      {/* Ambient Animated Glowing Red Aura Orb */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255, 0, 51, 0.2) 0%, rgba(179, 0, 0, 0.06) 50%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'floatOrb 8s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Background grid decoration */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage:
            'radial-gradient(ellipse 80% 50% at 50% 0%, black 0%, transparent 70%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 50% at 50% 0%, black 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '640px',
          position: 'relative',
          zIndex: 1,
          animation: 'cardEntrance 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '32px', position: 'relative' }}>
          {/* Red YouTube Logo mark */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              boxShadow: '0 8px 32px var(--red-glow-strong)',
              transition: 'transform 0.3s ease',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 48px)',
              fontWeight: '800',
              letterSpacing: '-1px',
              lineHeight: '1.1',
              background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '10px',
            }}
          >
            YouTube Live Count
          </h1>
          <p
            style={{
              fontSize: 'clamp(14px, 3vw, 17px)',
              color: 'var(--text-secondary)',
              maxWidth: '360px',
              margin: '0 auto',
              lineHeight: '1.5',
            }}
          >
            Track a YouTube Channel&apos;s subscribers{' '}
            <span style={{ color: 'var(--red)', fontWeight: '600' }}>in real time.</span>
          </p>

          {/* Switch back to WhatsApp Channel Counter Pill */}
          <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'center' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                borderRadius: '999px',
                background:
                  'linear-gradient(135deg, rgba(37, 211, 102, 0.12) 0%, rgba(18, 140, 126, 0.08) 100%)',
                border: '1px solid rgba(37, 211, 102, 0.3)',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: '600',
                textDecoration: 'none',
                boxShadow: '0 4px 18px rgba(37, 211, 102, 0.15)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#25d366" style={{ flexShrink: 0 }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>WhatsApp Channel Counter</span>
              <span style={{ color: 'var(--green)', fontWeight: '700' }}>→</span>
            </Link>
          </div>
        </header>

        {/* Main card */}
        <YouTubeCard initialQuery={prefilledQuery} />

        {/* Top YouTube Channels */}
        <RecommendedYouTubeChannels />
      </div>

      {/* Professional Footer (Red Theme) */}
      <footer
        style={{
          marginTop: '40px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: '500',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <span>Made with</span>
        <span
          style={{
            color: '#ff4d4d',
            display: 'inline-block',
            animation: 'heartbeat 1.5s ease-in-out infinite',
            fontSize: '14px',
          }}
        >
          ❤️
        </span>
        <span>by</span>
        <span style={{ color: 'var(--red)', fontWeight: '700', letterSpacing: '0.02em' }}>
          Agent X &amp; TechKey Team
        </span>
      </footer>
    </main>
  );
}

