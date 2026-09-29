'use client';

import { useState, useRef } from 'react';
import { validateChannelUrl } from '@/lib/validation';
import TurnstileCaptcha from '@/components/TurnstileCaptcha';

interface ChannelInputProps {
  onSubmit: (url: string, token: string) => void;
  isLoading: boolean;
}

export default function ChannelInput({ onSubmit, isLoading }: ChannelInputProps) {
  const [url, setUrl] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { valid, error } = validateChannelUrl(url);
    if (!valid) {
      setLocalError(error);
      inputRef.current?.focus();
      return;
    }

    if (!captchaToken) {
      setLocalError('Please complete the Cloudflare verification to track.');
      return;
    }

    setLocalError(null);
    onSubmit(url.trim(), captchaToken);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUrl(e.target.value);
    if (localError) setLocalError(null);
  }

  function handleCaptchaVerify(token: string) {
    setCaptchaToken(token);
    if (localError) setLocalError(null);
  }

  function handleCaptchaExpire() {
    setCaptchaToken(null);
  }

  const SAMPLE_CHANNELS = [
    { name: 'WhatsApp Channel', url: 'https://whatsapp.com/channel/0029Va4K0PZ5a245NkngBA2M' },
  ];

  const isVerified = Boolean(captchaToken);
  const isDisabled = isLoading || !isVerified;

  return (
    <form onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Input */}
        <div style={{ position: 'relative', width: '100%' }}>
          {/* WhatsApp icon inside input */}
          <div
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--green)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>

          <input
            ref={inputRef}
            id="channel-url-input"
            type="url"
            value={url}
            onChange={handleChange}
            placeholder="Paste WhatsApp channel link..."
            autoComplete="off"
            spellCheck={false}
            style={{
              width: '100%',
              minHeight: '52px',
              padding: '14px 16px 14px 50px',
              background: 'rgba(255,255,255,0.035)',
              border: `1.5px solid ${localError ? 'var(--error)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '16px',
              color: 'var(--text-primary)',
              fontSize: '16px',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'all 0.2s ease',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = localError ? 'var(--error)' : 'var(--green)';
              e.currentTarget.style.boxShadow = localError
                ? '0 0 0 3px rgba(255,68,68,0.15)'
                : '0 0 0 3px var(--green-glow-strong)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = localError ? 'var(--error)' : 'rgba(255,255,255,0.1)';
              e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.035)';
            }}
          />
        </div>

        {/* Validation error */}
        {localError && (
          <p
            style={{
              color: 'var(--error)',
              fontSize: '13px',
              fontWeight: '500',
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '-4px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {localError}
          </p>
        )}

        {/* Quick Sample Link Chip */}
        {!url && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '0 2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.05em' }}>
              TRY EXAMPLE:
            </span>
            {SAMPLE_CHANNELS.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => setUrl(sample.url)}
                style={{
                  background: 'rgba(37,211,102,0.08)',
                  border: '1px solid rgba(37,211,102,0.2)',
                  borderRadius: '999px',
                  padding: '4px 12px',
                  color: 'var(--green)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                + {sample.name}
              </button>
            ))}
          </div>
        )}

        {/* Cloudflare Turnstile Widget */}
        <TurnstileCaptcha
          onVerify={handleCaptchaVerify}
          onExpire={handleCaptchaExpire}
          onError={handleCaptchaExpire}
          resetSignal={resetSignal}
        />

        {/* Submit button */}
        <button
          id="check-channel-btn"
          type="submit"
          disabled={isDisabled}
          style={{
            width: '100%',
            minHeight: '52px',
            padding: '14px 24px',
            background: isLoading
              ? 'rgba(37,211,102,0.35)'
              : !isVerified
              ? 'rgba(255, 255, 255, 0.07)'
              : 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)',
            border: !isVerified && !isLoading ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
            borderRadius: '16px',
            color: !isVerified && !isLoading ? 'var(--text-muted)' : '#ffffff',
            fontSize: '16px',
            fontWeight: '700',
            fontFamily: 'inherit',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: isLoading || !isVerified ? 'none' : '0 8px 24px var(--green-glow-strong)',
            letterSpacing: '0.01em',
            opacity: isDisabled && !isLoading ? 0.75 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isDisabled) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(37,211,102,0.45)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDisabled) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px var(--green-glow-strong)';
            }
          }}
        >
          {isLoading ? (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                style={{ animation: 'spin 0.8s linear infinite' }}
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Fetching Live Data...
            </>
          ) : !isVerified ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Complete Verification to Track
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              Track Live Counter
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
}
