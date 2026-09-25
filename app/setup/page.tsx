'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ConnectionStatus } from '@/lib/types';

export default function SetupPage() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [initAge, setInitAge] = useState<number | null>(null);
  const [polling, setPolling] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'pairing'>('qr');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportBackup, setExportBackup] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    async function poll() {
      try {
        const res = await fetch('/api/auth', { cache: 'no-store' });
        const data = await res.json();

        if (data.status) {
          setStatus(data.status as ConnectionStatus);
          setInitAge(typeof data.initAge === 'number' ? data.initAge : null);
          setErrorMessage(null);

          // Stop polling once connected
          if ((data.status as ConnectionStatus).connected) {
            setPolling(false);
            clearInterval(timer);
          }
        } else if (data.error) {
          setErrorMessage(data.error);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(`Connection check failed: ${msg}`);
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
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth', { method: 'POST' });
      const data = await res.json();
      if (!data.ok && data.error) {
        setErrorMessage(data.error);
      }
      setPolling(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Reconnect failed: ${msg}`);
    } finally {
      setReconnecting(false);
    }
  }

  async function handleExport() {
    setExportLoading(true);
    try {
      const res = await fetch('/api/auth/export', { cache: 'no-store' });
      const data = await res.json();
      if (data.ok && data.backup) {
        setExportBackup(data.backup);
      } else {
        setErrorMessage(data.error || 'Export failed.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Export failed: ${msg}`);
    } finally {
      setExportLoading(false);
    }
  }

  async function handleCopy() {
    if (!exportBackup) return;
    await navigator.clipboard.writeText(exportBackup);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleRequestPairing(e: React.FormEvent) {

    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setPairingLoading(true);
    setErrorMessage(null);
    setPairingCode(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pairingCode', phone: phoneNumber }),
      });
      const data = await res.json();

      if (data.ok && data.pairingCode) {
        setPairingCode(data.pairingCode);
      } else {
        setErrorMessage(data.error || 'Failed to generate pairing code. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Pairing request error: ${msg}`);
    } finally {
      setPairingLoading(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '24px',
    padding: '36px clamp(20px, 5vw, 36px)',
    maxWidth: '500px',
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
      {/* Back to App Link */}
      <div style={{ width: '100%', maxWidth: '500px', marginBottom: '16px' }}>
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
        {/* Admin Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              background: 'rgba(37,211,102,0.1)',
              border: '1px solid rgba(37,211,102,0.25)',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: '700',
              color: 'var(--green)',
              marginBottom: '12px',
            }}
          >
            🔒 ADMIN PORTAL
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '800',
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px',
            }}
          >
            Connect WhatsApp Engine
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px', lineHeight: '1.5' }}>
            Link your WhatsApp once to power live subscriber counts for all visitors.
          </p>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div
            style={{
              background: 'rgba(255,68,68,0.08)',
              border: '1px solid rgba(255,68,68,0.25)',
              borderRadius: '12px',
              padding: '12px 16px',
              color: 'var(--error)',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <span>{errorMessage}</span>
            <button
              onClick={handleReconnect}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                textDecoration: 'underline',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Status: Connected */}
        {status?.connected ? (
          <div
            id="status-connected"
            style={{
              padding: '24px',
              background: 'rgba(37,211,102,0.08)',
              border: '1px solid rgba(37,211,102,0.25)',
              borderRadius: '16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(37,211,102,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--green)">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
            <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--green)', marginBottom: '6px' }}>
              Engine Connected!
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              WhatsApp session is active. Public visitors can now look up any channel.
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                padding: '10px 24px',
                background: 'var(--green)',
                color: '#000',
                borderRadius: '10px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '700',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Go to Live Counter →
            </Link>

            {/* Deploy to Cloud Panel */}
            <div
              style={{
                marginTop: '24px',
                padding: '20px',
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: '14px',
                textAlign: 'left',
              }}
            >
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#a5b4fc', marginBottom: '6px' }}>
                ☁️ Deploy to Render / Cloud?
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.6' }}>
                Cloud servers can&apos;t show QR codes (WhatsApp blocks data-center IPs).
                Export your local session and paste it as an env var on Render instead.
              </p>

              {!exportBackup ? (
                <button
                  onClick={handleExport}
                  disabled={exportLoading}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(99,102,241,0.2)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99,102,241,0.4)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: exportLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {exportLoading ? 'Exporting…' : '📤 Export Session for Cloud'}
                </button>
              ) : (
                <div>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    STEP 1 — Copy this value:
                  </p>
                  <div style={{ position: 'relative', marginBottom: '14px' }}>
                    <textarea
                      readOnly
                      value={exportBackup}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-secondary)',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        resize: 'none',
                        boxSizing: 'border-box',
                        lineBreak: 'anywhere',
                      }}
                    />
                    <button
                      onClick={handleCopy}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        padding: '4px 10px',
                        background: copied ? 'rgba(37,211,102,0.2)' : 'rgba(99,102,241,0.3)',
                        color: copied ? 'var(--green)' : '#a5b4fc',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      {copied ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>

                  <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    STEP 2 — On Render, go to your service → Environment:
                  </p>
                  <div
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      color: '#a5b4fc',
                      marginBottom: '10px',
                    }}
                  >
                    Key: <strong>WA_AUTH_BACKUP</strong><br />
                    Value: <em style={{ color: 'var(--text-muted)' }}>(paste what you copied)</em>
                  </div>

                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    STEP 3 — Click <strong>Save Changes</strong> on Render → it will redeploy automatically.
                    Your session will be restored and the app will work without any QR scan! ✨
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Tabs Selector: QR Code vs Phone Pairing */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                background: 'rgba(255,255,255,0.04)',
                padding: '4px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '1px solid var(--border)',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'qr' ? 'rgba(37,211,102,0.15)' : 'transparent',
                  color: activeTab === 'qr' ? 'var(--green)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'qr' ? '700' : '500',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                📷 Scan QR Code
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pairing')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'pairing' ? 'rgba(37,211,102,0.15)' : 'transparent',
                  color: activeTab === 'pairing' ? 'var(--green)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'pairing' ? '700' : '500',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                🔢 Phone Pairing Code
              </button>
            </div>

            {/* TAB 1: QR CODE */}
            {activeTab === 'qr' && (
              <div style={{ textAlign: 'center' }}>
                {status?.qrAvailable && status.qrCode ? (
                  <div>
                    <div
                      style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'inline-flex',
                        marginBottom: '20px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={status.qrCode}
                        alt="WhatsApp QR code"
                        width={240}
                        height={240}
                        style={{ display: 'block' }}
                      />
                    </div>

                    <ol
                      style={{
                        textAlign: 'left',
                        paddingLeft: '24px',
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        lineHeight: '2',
                        marginBottom: '20px',
                      }}
                    >
                      <li>Open WhatsApp on your phone</li>
                      <li>Tap <strong>Settings / Menu (⋮) → Linked Devices</strong></li>
                      <li>Tap <strong>Link a Device</strong> & scan this QR code</li>
                    </ol>

                    <button
                      onClick={handleReconnect}
                      disabled={reconnecting}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {reconnecting ? 'Refreshing QR…' : '🔄 Refresh QR Code'}
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '32px 16px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 16px', display: 'block' }}
                    >
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      Initializing WhatsApp Socket…
                    </p>
                    {initAge !== null && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        ⏱ Connecting for {initAge}s…
                      </p>
                    )}
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                      {initAge !== null && initAge > 20
                        ? '⚠️ Taking longer than usual. Try the Phone Pairing Code tab instead!'
                        : 'Generating new session QR code. If it takes a moment, click below.'}
                    </p>
                    <button
                      onClick={handleReconnect}
                      disabled={reconnecting}
                      style={{
                        background: 'rgba(37,211,102,0.15)',
                        color: 'var(--green)',
                        border: '1px solid rgba(37,211,102,0.3)',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      {reconnecting ? 'Starting…' : '⚡ Generate QR Code Now'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PHONE NUMBER PAIRING CODE */}
            {activeTab === 'pairing' && (
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  No camera needed! Enter your phone number with country code to receive an 8-digit linking code.
                </p>

                <form onSubmit={handleRequestPairing}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      PHONE NUMBER (WITH COUNTRY CODE):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 94712345678 or 1234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={pairingLoading || !phoneNumber.trim()}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'var(--green)',
                      color: '#000',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: pairingLoading ? 'not-allowed' : 'pointer',
                      opacity: pairingLoading || !phoneNumber.trim() ? 0.6 : 1,
                    }}
                  >
                    {pairingLoading ? 'Requesting Code…' : 'Get 8-Digit Pairing Code'}
                  </button>
                </form>

                {pairingCode && (
                  <div
                    style={{
                      marginTop: '24px',
                      padding: '20px',
                      background: 'rgba(37,211,102,0.1)',
                      border: '1px solid rgba(37,211,102,0.3)',
                      borderRadius: '14px',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      YOUR 8-DIGIT PAIRING CODE:
                    </p>
                    <div
                      style={{
                        fontSize: '32px',
                        fontWeight: '900',
                        letterSpacing: '4px',
                        color: 'var(--green)',
                        fontFamily: 'monospace',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: '10px',
                        marginBottom: '14px',
                      }}
                    >
                      {pairingCode}
                    </div>

                    <ol style={{ textAlign: 'left', paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.8' }}>
                      <li>On your phone, tap WhatsApp notification OR:</li>
                      <li>Go to <strong>Settings → Linked Devices → Link with phone number instead</strong></li>
                      <li>Type the 8 characters above to link immediately</li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Professional Footer */}
      <footer
        style={{
          marginTop: '32px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: '500',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
