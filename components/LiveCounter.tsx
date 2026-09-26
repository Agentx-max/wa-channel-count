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

const DIGIT_COLORS = [
  { name: 'Classic White', hex: '#ffffff' },
  { name: 'WhatsApp Green', hex: '#25D366' },
  { name: 'Neon Cyan', hex: '#00E5FF' },
  { name: 'Gold Yellow', hex: '#FFC107' },
  { name: 'Hot Pink', hex: '#FF2A85' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Crimson Red', hex: '#FF3B30' },
  { name: 'Vibrant Orange', hex: '#FF9500' },
  { name: 'Lime Green', hex: '#84CC16' },
  { name: 'Sky Blue', hex: '#38BDF8' },
];

const POLL_INTERVAL = 5000; // Locked to 5 seconds

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
  const [digitColor, setDigitColor] = useState<string>('#ffffff');
  const [showRealTime, setShowRealTime] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedColor = localStorage.getItem('wa_counter_digit_color');
      if (savedColor) setDigitColor(savedColor);

      const savedShowClock = localStorage.getItem('wa_counter_show_clock');
      if (savedShowClock !== null) setShowRealTime(savedShowClock === 'true');
    } catch {
      // ignore
    }
  }, []);

  // Save color preference
  const handleColorChange = (hex: string) => {
    setDigitColor(hex);
    try {
      localStorage.setItem('wa_counter_digit_color', hex);
    } catch {
      // ignore
    }
  };

  // Toggle real-life time clock
  const handleToggleRealTime = () => {
    setShowRealTime((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('wa_counter_show_clock', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Reset to default
  const handleResetSettings = () => {
    setDigitColor('#ffffff');
    setShowRealTime(false);
    try {
      localStorage.removeItem('wa_counter_digit_color');
      localStorage.removeItem('wa_counter_show_clock');
    } catch {
      // ignore
    }
  };

  // Ticking real-life clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close settings popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [settingsOpen]);

  // Periodic polling for live subscriber updates locked to 5 seconds
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

    intervalRef.current = setInterval(refresh, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelUrl, channel.followers]);

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

      {/* Follower Odometer Display with Customizable Digit Color */}
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
            digitColor={digitColor}
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

      {/* Bottom Container Bar: LIVE Status, Real-Life Time Display & Settings Icon */}
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
          position: 'relative',
        }}
      >
        {/* Left: LIVE Badge & Last Updated */}
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

        {/* Center / Right: Real-Life Time (when toggled on) */}
        {showRealTime && (
          <div
            id="real-life-time-display"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#ffffff',
              fontFamily: "'Inter', monospace",
              letterSpacing: '0.04em',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--green)' }}>🕒</span>
            <span>{currentTime}</span>
          </div>
        )}

        {/* Right: Customization Setting Gear Icon Button */}
        <div style={{ position: 'relative' }} ref={settingsRef}>
          <button
            id="settings-btn"
            onClick={() => setSettingsOpen((prev) => !prev)}
            title="Customize digit colors & clock"
            aria-label="Customize settings"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: settingsOpen ? 'rgba(37,211,102,0.18)' : 'rgba(255,255,255,0.06)',
              border: settingsOpen ? '1px solid var(--green)' : '1px solid rgba(255,255,255,0.12)',
              color: settingsOpen ? 'var(--green)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!settingsOpen) {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (!settingsOpen) {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              }
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: settingsOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s ease',
              }}
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>

          {/* Simple Settings Popover: 10 Colors & Real-Life Time Toggle */}
          {settingsOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: '46px',
                right: '0',
                width: '260px',
                background: 'rgba(15, 18, 26, 0.96)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '14px',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(37, 211, 102, 0.2)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                zIndex: 50,
                animation: 'popIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  DIGIT COLOR (10 COLORS)
                </span>
                <button
                  onClick={() => setSettingsOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: '2px 4px',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* 10 Colors Swatches Grid (5 x 2) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '8px',
                  marginBottom: '14px',
                }}
              >
                {DIGIT_COLORS.map((col) => {
                  const isSelected = digitColor.toLowerCase() === col.hex.toLowerCase();
                  return (
                    <button
                      key={col.hex}
                      onClick={() => handleColorChange(col.hex)}
                      title={col.name}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: col.hex,
                        border: isSelected ? '2.5px solid #ffffff' : '2px solid rgba(255,255,255,0.15)',
                        outline: isSelected ? '2px solid var(--green)' : 'none',
                        outlineOffset: '2px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        boxShadow: isSelected ? `0 0 12px ${col.hex}` : '0 2px 6px rgba(0,0,0,0.3)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {isSelected && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={col.hex === '#ffffff' ? '#000000' : '#ffffff'}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div
                style={{
                  height: '1px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  margin: '10px 0',
                }}
              />

              {/* Show Real-Life Time Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px' }}>🕒</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff' }}>
                    Show Real-Life Time
                  </span>
                </div>

                <button
                  id="toggle-real-time-btn"
                  onClick={handleToggleRealTime}
                  aria-pressed={showRealTime}
                  title="Toggle real-life clock display in bottom bar"
                  style={{
                    width: '40px',
                    height: '22px',
                    borderRadius: '999px',
                    background: showRealTime ? 'var(--green)' : 'rgba(255, 255, 255, 0.18)',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: showRealTime ? '20px' : '2px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                      transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </button>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: '1px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  margin: '10px 0',
                }}
              />

              {/* Footer: Reset to Default */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleResetSettings}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  Reset to default
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.8); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-3px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
