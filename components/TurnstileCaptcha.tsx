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
            onVerify(token);
          },
          'expired-callback': () => {
            if (!isMounted) return;
            if (onExpire) onExpire();
          },
          'error-callback': (err?: unknown) => {
            if (!isMounted) return;
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
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '65px',
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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
