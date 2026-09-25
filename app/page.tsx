import Link from 'next/link';
import ChannelCard from '@/components/ChannelCard';
import RecommendedChannels from '@/components/RecommendedChannels';

export default function Home() {
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
          'radial-gradient(ellipse 100% 60% at 50% -20%, rgba(37,211,102,0.12) 0%, transparent 75%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient Animated Glowing Aura Orb */}
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
          background: 'radial-gradient(circle, rgba(37,211,102,0.18) 0%, rgba(18,140,126,0.05) 50%, transparent 70%)',
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
          {/* Logo mark */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              boxShadow: '0 8px 32px var(--green-glow-strong)',
              transition: 'transform 0.3s ease',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
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
            WhatsApp Live Count
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
            Track a WhatsApp Channel&apos;s followers{' '}
            <span style={{ color: 'var(--green)', fontWeight: '600' }}>in real time.</span>
          </p>
        </header>

        {/* Main card */}
        <ChannelCard />

        {/* Recommended Channels */}
        <RecommendedChannels />
      </div>

      {/* Professional Footer */}
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
        <span style={{ color: 'var(--green)', fontWeight: '700', letterSpacing: '0.02em' }}>
          Agent X &amp; TechKey Team
        </span>
      </footer>
    </main>
  );
}
