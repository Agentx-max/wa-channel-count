'use client';

import { useEffect, useRef, useState } from 'react';

interface TurnstileCaptchaProps {
  siteKey?: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error?: unknown) => void;
  resetSignal?: number;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
          callback?: (token: string) => void;
          'error-callback'?: (error?: unknown) => void;
          'expired-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

const DEFAULT_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAFE7AufdjdI47RVb';

export default function TurnstileCaptcha({
  siteKey = DEFAULT_SITE_KEY,
  onVerify,
  onExpire,
  onError,
  resetSignal = 0,
}: TurnstileCaptchaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    function renderWidget() {
      if (!containerRef.current || !window.turnstile) return;

      try {
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore
          }
          widgetIdRef.current = null;
        }

        containerRef.current.innerHTML = '';

        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'dark',
          size: 'normal',
          callback: (token: string) => {
            if (!isMounted) return;
            setIsVerified(true);
            onVerify(token);
          },
          'expired-callback': () => {
            if (!isMounted) return;
            setIsVerified(false);
            if (onExpire) onExpire();
          },
          'error-callback': (err?: unknown) => {
            if (!isMounted) return;
            setIsVerified(false);
            if (onError) onError(err);
          },
        });

        widgetIdRef.current = id;
        setIsLoaded(true);
        setLoadError(false);
      } catch (err) {
        console.error('[Turnstile] Render error:', err);
        if (isMounted) setLoadError(true);
      }
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript = document.querySelector(
        'script[src*="challenges.cloudflare.com/turnstile"]'
      );

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';
        script.async = true;
        script.defer = true;
        script.onerror = () => {
          if (isMounted) setLoadError(true);
        };
        document.head.appendChild(script);
      }

      window.onloadTurnstileCallback = () => {
        if (isMounted) {
          renderWidget();
        }
      };
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, [siteKey, resetSignal]);

  return (
    <div
      className="turnstile-box-container"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 14px',
        background: isVerified
          ? 'rgba(37, 211, 102, 0.04)'
          : 'rgba(255, 255, 255, 0.02)',
        border: `1.5px solid ${
          isVerified ? 'rgba(37, 211, 102, 0.35)' : 'rgba(255, 255, 255, 0.08)'
        }`,
        borderRadius: '16px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        boxShadow: isVerified
          ? '0 4px 20px rgba(37, 211, 102, 0.15)'
          : 'inset 0 2px 4px rgba(0,0,0,0.2)',
      }}
    >
      {/* Security Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginBottom: '8px',
          padding: '0 4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isVerified ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
          <span
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: isVerified ? 'var(--green)' : 'var(--text-secondary)',
              letterSpacing: '0.01em',
            }}
          >
            {isVerified ? 'Verification Complete' : 'Cloudflare Security Check'}
          </span>
        </div>

        <span
          style={{
            fontSize: '10px',
            fontWeight: '700',
            color: isVerified ? 'var(--green)' : 'var(--text-muted)',
            padding: '2px 7px',
            borderRadius: '999px',
            background: isVerified ? 'rgba(37,211,102,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isVerified ? 'rgba(37,211,102,0.25)' : 'rgba(255,255,255,0.08)'}`,
            letterSpacing: '0.05em',
          }}
        >
          {isVerified ? 'VERIFIED' : 'REQUIRED'}
        </span>
      </div>

      {/* Turnstile Widget / Fallback Skeleton */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '65px',
          position: 'relative',
        }}
      >
        {!isLoaded && !loadError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-muted)',
              fontSize: '12px',
              padding: '12px',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ animation: 'spin 0.8s linear infinite' }}
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            <span>Loading security challenge...</span>
          </div>
        )}

        {loadError && (
          <div
            style={{
              color: 'var(--error)',
              fontSize: '12px',
              textAlign: 'center',
              padding: '8px',
            }}
          >
            Failed to load security verification. Please refresh or check adblocker.
          </div>
        )}

        <div
          ref={containerRef}
          style={{
            display: loadError ? 'none' : 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        />
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 360px) {
          .turnstile-box-container iframe {
            transform: scale(0.85);
            transform-origin: center center;
          }
        }
      `}</style>
    </div>
  );
}
