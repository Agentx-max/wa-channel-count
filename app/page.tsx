import Link from 'next/link';
import ChannelCard from '@/components/ChannelCard';

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background:
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37,211,102,0.07) 0%, transparent 70%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
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
        }}
      />

      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
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
            margin: '0 auto 20px',
            boxShadow: '0 8px 32px var(--green-glow-strong)',
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
            marginBottom: '12px',
          }}
        >
          WhatsApp Live Count
        </h1>
        <p
          style={{
            fontSize: 'clamp(15px, 3vw, 18px)',
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
    </main>
  );
}
