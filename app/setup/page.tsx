'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ConnectionStatus } from '@/lib/types';

export default function SetupPage() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [polling, setPolling] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    async function poll() {
      try {
        const res = await fetch('/api/auth', { cache: 'no-store' });
        const data = await res.json();
        setStatus(data.status as ConnectionStatus);

        // Stop polling once connected
        if ((data.status as ConnectionStatus).connected) {
          setPolling(false);
          clearInterval(timer);
        }
      } catch {
        // ignore network errors, keep polling
      }
    }

    if (polling) {
      void poll();
      timer = setInterval(poll, 3000);
    }

    return () => clearInterval(timer);
  }, [polling]);

  async function handleReconnect() {
    setReconnecting(true);
    try {
      await fetch('/api/auth', { method: 'POST' });
      setPolling(true);
    } finally {
      setReconnecting(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: '32px',
    maxWidth: '460px',
    width: '100%',
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37,211,102,0.06) 0%, transparent 70%)',
      }}
    >
      {/* Back */}
      <div style={{ width: '100%', maxWidth: '460px', marginBottom: '16px' }}>
        <Link
          href="/"
          id="back-home"
          style={{
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--green)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Back to App
        </Link>
      </div>

      <div style={cardStyle}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'rgba(37,211,102,0.1)',
            border: '1px solid rgba(37,211,102,0.25)',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--green)',
            marginBottom: '12px',
          }}
        >
          🔒 ADMIN CONTROL PANEL
        </div>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: '700',
            marginBottom: '6px',
            color: 'var(--text-primary)',
          }}
        >
          WhatsApp Engine Setup
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '28px', lineHeight: '1.5' }}>
          <strong>Website Owner Only:</strong> Scan this QR code <u>ONCE</u> with your phone to power live channel lookups for all public visitors.
        </p>

        {/* Loading state */}
        {status === null && (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            <p>Checking connection status…</p>
          </div>
        )}

        {/* Connected */}
        {status?.connected && (
          <div
            id="status-connected"
            style={{
              padding: '20px',
              background: 'rgba(37,211,102,0.08)',
              border: '1px solid rgba(37,211,102,0.25)',
              borderRadius: '14px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(37,211,102,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="var(--green)">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
            <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--green)', marginBottom: '6px' }}>
              Connected!
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              WhatsApp is connected. Head back to the app to track channels.
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                marginTop: '18px',
                padding: '10px 24px',
                background: 'var(--green)',
                color: '#fff',
                borderRadius: '10px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Go to App →
            </Link>
          </div>
        )}

        {/* QR code to scan */}
        {status && !status.connected && status.qrAvailable && status.qrCode && (
          <div id="qr-section">
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '16px',
                display: 'inline-flex',
                marginBottom: '20px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={status.qrCode}
                alt="WhatsApp QR code to scan"
                width={240}
                height={240}
                style={{ display: 'block' }}
              />
            </div>

            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', color: 'var(--text-primary)' }}>
              Scan with WhatsApp
            </h2>

            <ol style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '2' }}>
              <li>Open WhatsApp on your phone</li>
              <li>Tap Menu (⋮) → Linked Devices</li>
              <li>Tap &quot;Link a Device&quot;</li>
              <li>Point your camera at this QR code</li>
            </ol>

            <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
              QR code refreshes automatically. This page polls every 3 seconds.
            </p>
          </div>
        )}

        {/* Waiting for QR */}
        {status && !status.connected && !status.qrAvailable && !status.loggedOut && (
          <div
            id="status-waiting"
            style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            <p style={{ marginBottom: '6px', fontWeight: '600' }}>Generating QR code…</p>
            <p style={{ fontSize: '13px' }}>
              {status.reconnecting ? 'Connecting to WhatsApp…' : 'Waiting for WhatsApp connection…'}
            </p>
          </div>
        )}

        {/* Logged out */}
        {status?.loggedOut && (
          <div
            id="status-logged-out"
            style={{
              padding: '20px',
              background: 'rgba(255,68,68,0.06)',
              border: '1px solid rgba(255,68,68,0.2)',
              borderRadius: '14px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'var(--error)', fontWeight: '600', marginBottom: '8px' }}>
              WhatsApp session ended
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
              Your session has been logged out. Delete the <code style={{ background: 'rgba(255,255,255,0.07)', padding: '2px 6px', borderRadius: '4px' }}>./auth</code> folder and restart the server to log in again.
            </p>
            <button
              id="reconnect-btn"
              onClick={handleReconnect}
              disabled={reconnecting}
              style={{
                padding: '10px 20px',
                background: 'var(--green)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: reconnecting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'inherit',
                opacity: reconnecting ? 0.6 : 1,
              }}
            >
              {reconnecting ? 'Reconnecting…' : 'Try Reconnect'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
