'use client';

import { useState, useEffect, useRef } from 'react';
import type { ChannelData } from '@/lib/types';
import { formatFollowerCount } from '@/lib/channel';
import OdometerCounter from './OdometerCounter';

interface LiveCounterProps {
  channel: ChannelData;
  channelUrl: string;
  onReset: () => void;
}

export default function LiveCounter({ channel: initialChannel, channelUrl, onReset }: LiveCounterProps) {
  const [channel, setChannel] = useState<ChannelData>(initialChannel);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [prevCount, setPrevCount] = useState<number | null>(null);
  const [countChanged, setCountChanged] = useState(false);
  const [pollInterval, setPollInterval] = useState<number>(5000); // 5 sec default for smooth live feel
  const [imgError, setImgError] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Periodic polling for live subscriber updates
  useEffect(() => {
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

    intervalRef.current = setInterval(refresh, pollInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelUrl, channel.followers, pollInterval]);

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

  return (
    <div style={{ width: '100%' }}>
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

      {/* Follower Odometer Display */}
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
          <OdometerCounter value={channel.followers} fontSize="clamp(36px, 11vw, 84px)" />
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
        {countChanged && prevCount !== null && (
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

      {/* Live Status & Speed Controls */}
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
        {/* LIVE Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'rgba(37,211,102,0.12)',
              border: '1px solid rgba(37,211,102,0.3)',
              borderRadius: '999px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--green)',
                display: 'inline-block',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: '800',
                color: 'var(--green)',
                letterSpacing: '0.1em',
              }}
            >
              LIVE
            </span>
          </div>

          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            onClick={triggerManualRefresh}
            title="Click to refresh now"
          >
            {refreshing ? 'Updating…' : `${formatSecondsAgo(secondsAgo)}`}
          </span>
        </div>

        {/* Polling Interval Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', marginRight: '2px' }}>
            RATE:
          </span>
          {[
            { label: '3s', ms: 3000 },
            { label: '5s', ms: 5000 },
            { label: '10s', ms: 10000 },
            { label: '30s', ms: 30000 },
          ].map((item) => (
            <button
              key={item.ms}
              onClick={() => setPollInterval(item.ms)}
              style={{
                background: pollInterval === item.ms ? 'var(--green)' : 'rgba(255,255,255,0.06)',
                color: pollInterval === item.ms ? '#000000' : 'var(--text-secondary)',
                fontWeight: pollInterval === item.ms ? '800' : '600',
                border: 'none',
                borderRadius: '8px',
                padding: '5px 9px',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

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
