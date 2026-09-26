'use client';

import { useState, useEffect, useRef } from 'react';
import type { ChannelData } from '@/lib/types';
import { formatFollowerCount } from '@/lib/channel';
import OdometerCounter from './OdometerCounter';
import CounterCustomizerModal from './CounterCustomizerModal';
import {
  CounterCustomization,
  DEFAULT_CUSTOMIZATION,
  loadSavedCustomization,
  saveCustomizationToStorage,
  getFontFamilyCSS,
  playTickSound,
} from '@/lib/customization';

interface LiveCounterProps {
  channel: ChannelData;
  channelUrl: string;
  onReset: () => void;
}

const SIZE_SCALE_MAP: Record<CounterCustomization['sizeScale'], number> = {
  compact: 0.85,
  normal: 1,
  large: 1.15,
  mega: 1.3,
};

export default function LiveCounter({ channel: initialChannel, channelUrl, onReset }: LiveCounterProps) {
  const [channel, setChannel] = useState<ChannelData>(initialChannel);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [prevCount, setPrevCount] = useState<number | null>(null);
  const [countChanged, setCountChanged] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Customization state
  const [customization, setCustomization] = useState<CounterCustomization>(DEFAULT_CUSTOMIZATION);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load customizations from localStorage on client mount
  useEffect(() => {
    const saved = loadSavedCustomization();
    setCustomization(saved);
  }, []);

  const handleCustomizationChange = (updated: CounterCustomization) => {
    setCustomization(updated);
    saveCustomizationToStorage(updated);
  };

  const handleResetCustomization = () => {
    setCustomization(DEFAULT_CUSTOMIZATION);
    saveCustomizationToStorage(DEFAULT_CUSTOMIZATION);
  };

  // Periodic polling for live subscriber updates
  useEffect(() => {
    if (!customization.autoRefreshEnabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    async function refresh() {
      setRefreshing(true);
      try {
        const res = await fetch(
          `/api/channel?url=${encodeURIComponent(channelUrl)}`,
          { cache: 'no-store' },
        );
        const data = await res.json();

        if (data.success) {
          const newCount = data.channel.followers;
          if (newCount !== channel.followers) {
            setPrevCount(channel.followers);
            setCountChanged(true);
            if (customization.soundEnabled) {
              playTickSound();
            }
            setTimeout(() => setCountChanged(false), 1200);
          }
          setChannel(data.channel);
          setLastUpdated(new Date());
          setRefreshError(null);
          setSecondsAgo(0);
        } else {
          setRefreshError('Retrying...');
        }
      } catch {
        setRefreshError('Retrying...');
      } finally {
        setRefreshing(false);
      }
    }

    intervalRef.current = setInterval(refresh, customization.pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelUrl, channel.followers, customization.pollIntervalMs, customization.autoRefreshEnabled, customization.soundEnabled]);

  // Clock: "Updated X seconds ago"
  useEffect(() => {
    clockRef.current = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => {
      if (clockRef.current) clearInterval(clockRef.current);
    };
  }, [lastUpdated]);

  function formatSecondsAgo(s: number): string {
    if (s < 3) return 'just now';
    if (s < 60) return `${s}s ago`;
    return `${Math.floor(s / 60)}m ago`;
  }

  // Trigger manual refresh
  const triggerManualRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const res = await fetch(
        `/api/channel?url=${encodeURIComponent(channelUrl)}`,
        { cache: 'no-store' },
      );
      const data = await res.json();
      if (data.success) {
        const newCount = data.channel.followers;
        if (newCount !== channel.followers) {
          setPrevCount(channel.followers);
          setCountChanged(true);
          if (customization.soundEnabled) {
            playTickSound();
          }
          setTimeout(() => setCountChanged(false), 1200);
        }
        setChannel(data.channel);
        setLastUpdated(new Date());
        setRefreshError(null);
        setSecondsAgo(0);
      }
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  // Timestamp display string based on user customization
  const renderTimestampText = () => {
    if (refreshing) return 'Updating…';
    if (refreshError) return refreshError;

    switch (customization.timestampFormat) {
      case 'exact':
        return lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      case 'both':
        return `${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} (${formatSecondsAgo(secondsAgo)})`;
      case 'hidden':
        return '';
      case 'relative':
      default:
        return formatSecondsAgo(secondsAgo);
    }
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Header with Channel Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
          {/* Channel picture */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
              border: '2px solid rgba(37,211,102,0.4)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            {channel.picture && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={channel.picture}
                alt={`${channel.name} channel picture`}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                }}
              >
                {channel.name ? channel.name.charAt(0) : 'W'}
              </span>
            )}
          </div>

          {/* Channel name, verified badge & subtitle */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2
                style={{
                  fontSize: 'clamp(16px, 4vw, 20px)',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '1.2',
                }}
              >
                {channel.name}
              </h2>
              {channel.verified && (
                <span title="Verified Channel" style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              WhatsApp Channel
            </p>
          </div>
        </div>

        {/* Change Channel Button */}
        <button
          id="reset-btn"
          onClick={onReset}
          title="Search another channel"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: 'var(--text-secondary)',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            fontFamily: 'inherit',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          <span className="mobile-hide">Change</span>
        </button>
      </div>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          background: 'rgba(255,255,255,0.07)',
          margin: '0 0 24px',
        }}
      />

      {/* Follower Odometer Display Container */}
      <div style={{ textAlign: 'center', marginBottom: '24px', width: '100%', overflow: 'hidden' }}>
        <div
          id="follower-count"
          style={{
            padding: '12px 0',
            width: '100%',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <OdometerCounter
            value={channel.followers}
            fontSize="clamp(36px, 11vw, 84px)"
            digitColor={customization.digitColor}
            glowColor={customization.glowColor}
            glowIntensity={customization.glowIntensity}
            isGradient={customization.isGradient}
            fontFamily={getFontFamilyCSS(customization.fontFamily)}
            sizeMultiplier={SIZE_SCALE_MAP[customization.sizeScale] || 1}
            duration={customization.animDurationMs}
            separatorType={customization.separatorType}
            separatorColor={customization.separatorColor}
          />
        </div>

        <p
          style={{
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            marginTop: '8px',
          }}
        >
          Live Followers
        </p>

        {/* Dynamic Delta Indicator */}
        {customization.showDeltaIndicator && countChanged && prevCount !== null && (
          <p
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: channel.followers >= prevCount ? 'var(--green-light)' : 'var(--error)',
              marginTop: '6px',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            {channel.followers >= prevCount
              ? `▲ +${formatFollowerCount(channel.followers - prevCount)}`
              : `▼ -${formatFollowerCount(prevCount - channel.followers)}`}
          </p>
        )}
      </div>

      {/* Live Status & Speed Controls (Bottom Container Bar with Customize Button at Right Bottom) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '12px 16px',
        }}
      >
        {/* Left Side: LIVE Badge & Timestamp Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: customization.autoRefreshEnabled
                ? 'rgba(37,211,102,0.12)'
                : 'rgba(255,255,255,0.06)',
              border: `1px solid ${
                customization.autoRefreshEnabled
                  ? 'rgba(37,211,102,0.3)'
                  : 'rgba(255,255,255,0.1)'
              }`,
              borderRadius: '999px',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: customization.autoRefreshEnabled ? 'var(--green)' : 'var(--text-muted)',
                display: 'inline-block',
                animation: customization.autoRefreshEnabled ? 'pulse 1.5s ease-in-out infinite' : 'none',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: '800',
                color: customization.autoRefreshEnabled ? 'var(--green)' : 'var(--text-muted)',
                letterSpacing: '0.1em',
              }}
            >
              {customization.autoRefreshEnabled ? 'LIVE' : 'PAUSED'}
            </span>
          </div>

          {/* Timestamp text */}
          {customization.timestampFormat !== 'hidden' && (
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              onClick={triggerManualRefresh}
              title="Click to refresh follower count now"
            >
              {renderTimestampText()}
            </span>
          )}
        </div>

        {/* Right Bottom: Refresh Rate Indicator & Customize Icon Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
            marginLeft: 'auto',
          }}
        >
          {/* Quick Rate Indicator */}
          <button
            onClick={() => setIsCustomizerOpen(true)}
            title="Click to change refresh rate & timestamps"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '5px 8px',
              fontSize: '11px',
              fontWeight: '700',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
          >
            <span>⏱️</span>
            <span>{customization.pollIntervalMs / 1000}s</span>
          </button>

          {/* Customize Icon Button in right bottom */}
          <button
            id="customize-counter-btn"
            onClick={() => setIsCustomizerOpen(true)}
            title="Customize digit colors, refresh rate timestamps & styles"
            aria-label="Customize live counter"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, rgba(37,211,102,0.16) 0%, rgba(18,140,126,0.22) 100%)',
              border: '1px solid rgba(37,211,102,0.4)',
              borderRadius: '10px',
              padding: '6px 12px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 2px 10px rgba(37,211,102,0.18)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
              e.currentTarget.style.borderColor = 'rgba(37,211,102,0.8)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,211,102,0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.borderColor = 'rgba(37,211,102,0.4)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(37,211,102,0.18)';
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--green)' }}
            >
              <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
              <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
            </svg>
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* Customizer Studio Modal */}
      <CounterCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        customization={customization}
        onChange={handleCustomizationChange}
        onReset={handleResetCustomization}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.8); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
