import type { Metadata } from 'next';
import YouTubeCard from '@/components/YouTubeCard';
import RecommendedYouTubeChannels from '@/components/RecommendedYouTubeChannels';
import UpdatesBell from '@/components/UpdatesBell';
import CounterNavMenu from '@/components/CounterNavMenu';

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
      {/* Top-left Hamburger Menu & Top-right Updates Bell (Red Theme) */}
      <CounterNavMenu theme="red" />
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

