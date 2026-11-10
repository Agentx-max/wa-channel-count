'use client';

import { useState, useRef, useEffect } from 'react';
import { parseYouTubeInput } from '@/lib/youtube';
import type { YouTubeSearchItem } from '@/lib/types';
import TurnstileCaptcha from '@/components/TurnstileCaptcha';

interface YouTubeInputProps {
  onSubmit: (queryOrUrl: string, token: string) => void;
  isLoading: boolean;
}

const SAMPLE_CHANNELS = [
  { name: 'MrBeast', url: 'https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA' },
  { name: 'T-Series', url: 'https://www.youtube.com/channel/UCq-Fj5jknLsUf-MWSy4_brA' },
  { name: 'MKBHD', url: 'https://www.youtube.com/channel/UCBJycsmduvYEL83R_U4JriQ' },
];

export default function YouTubeInput({ onSubmit, isLoading }: YouTubeInputProps) {
  const [inputVal, setInputVal] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSignal] = useState(0);

  // Live search suggestions state
  const [suggestions, setSuggestions] = useState<YouTubeSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced channel search for non-ID queries
  useEffect(() => {
    const trimmed = inputVal.trim();
    if (!trimmed || trimmed.length < 2 || selectedId) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    const parsed = parseYouTubeInput(trimmed);
    if (!parsed.valid || parsed.type === 'id') {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/youtube?action=search&q=${encodeURIComponent(parsed.value)}`
        );
        const data = await res.json();
        if (!cancelled && data.success && Array.isArray(data.results)) {
          setSuggestions(data.results.slice(0, 5));
          setShowSuggestions(true);
        }
      } catch {
        // ignore search suggestion errors
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inputVal, selectedId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const targetQuery = selectedId || inputVal;
    const { valid, error } = parseYouTubeInput(targetQuery);
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
    setShowSuggestions(false);
    onSubmit(targetQuery.trim(), captchaToken);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputVal(e.target.value);
    setSelectedId(null);
    if (localError) setLocalError(null);
  }

  function handleSelectSuggestion(item: YouTubeSearchItem) {
    setInputVal(item.name);
    setSelectedId(item.id);
    setShowSuggestions(false);
    if (localError) setLocalError(null);
    if (captchaToken) {
      onSubmit(item.id, captchaToken);
    }
  }

  function handleCaptchaVerify(token: string) {
    setCaptchaToken(token);
    if (localError) setLocalError(null);
  }

  function handleCaptchaExpire() {
    setCaptchaToken(null);
  }

  const isVerified = Boolean(captchaToken);
  const isDisabled = isLoading || !isVerified;

  return (
    <form onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Input + Autocomplete Wrapper */}
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
          {/* YouTube icon inside input */}
          <div
            style={{
              position: 'absolute',
              left: '16px',
              top: '26px',
              transform: 'translateY(-50%)',
              color: 'var(--red)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>

          <input
            ref={inputRef}
            id="yt-channel-url-input"
            type="text"
            value={inputVal}
            onChange={handleChange}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = localError ? 'var(--error)' : 'var(--red)';
              e.currentTarget.style.boxShadow = localError
                ? '0 0 0 3px rgba(255,68,68,0.15)'
                : '0 0 0 3px var(--red-glow-strong)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = localError
                ? 'var(--error)'
                : 'rgba(255,255,255,0.1)';
              e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.035)';
            }}
            placeholder="Paste YouTube link, @handle, or channel name..."
            autoComplete="off"
            spellCheck={false}
            style={{
              width: '100%',
              minHeight: '52px',
              padding: '14px 40px 14px 50px',
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
          />

          {/* Subtle spinner while searching suggestions */}
          {searching && (
            <div
              style={{
                position: 'absolute',
                right: '14px',
                top: '26px',
                transform: 'translateY(-50%)',
                color: 'var(--red)',
                display: 'flex',
                alignItems: 'center',
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
            </div>
          )}

          {/* Search Suggestions List (In-flow so it expands the card cleanly and never overlaps) */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              style={{
                marginTop: '10px',
                width: '100%',
                maxHeight: '240px',
                overflowY: 'auto',
                background: 'rgba(10, 12, 18, 0.98)',
                border: '1px solid rgba(255, 0, 51, 0.3)',
                borderRadius: '16px',
                padding: '6px',
                boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: 'var(--text-muted)',
                  padding: '4px 10px 2px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Matching YouTube Channels
              </div>
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '11px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 0, 51, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255, 0, 51, 0.35)',
                      }}
                    >
                      {item.picture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.picture}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                          {item.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: '10.5px',
                          color: 'var(--text-muted)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {item.id}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: 'var(--red-light)',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      background: 'rgba(255, 0, 51, 0.12)',
                      border: '1px solid rgba(255, 0, 51, 0.25)',
                      flexShrink: 0,
                    }}
                  >
                    Select
                  </span>
                </button>
              ))}
            </div>
          )}
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

        {/* Quick Sample Link Chips */}
        {!inputVal && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              padding: '0 2px',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontWeight: '600',
                letterSpacing: '0.05em',
              }}
            >
              TRY EXAMPLE:
            </span>
            {SAMPLE_CHANNELS.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => {
                  setInputVal(sample.url);
                  setSelectedId(null);
                  setShowSuggestions(false);
                }}
                style={{
                  background: 'rgba(255, 0, 51, 0.08)',
                  border: '1px solid rgba(255, 0, 51, 0.24)',
                  borderRadius: '999px',
                  padding: '4px 12px',
                  color: 'var(--red-light)',
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
          id="check-yt-channel-btn"
          type="submit"
          disabled={isDisabled}
          style={{
            width: '100%',
            minHeight: '52px',
            padding: '14px 24px',
            background: isLoading
              ? 'rgba(255, 0, 51, 0.35)'
              : !isVerified
                ? 'rgba(255, 255, 255, 0.07)'
                : 'linear-gradient(135deg, #ff0033 0%, #b30000 100%)',
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
            boxShadow: isLoading || !isVerified ? 'none' : '0 8px 24px var(--red-glow-strong)',
            letterSpacing: '0.01em',
            opacity: isDisabled && !isLoading ? 0.75 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isDisabled) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 0, 51, 0.48)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDisabled) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px var(--red-glow-strong)';
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
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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

