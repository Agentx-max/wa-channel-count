'use client';

import { useState, useEffect, useRef } from 'react';
import type { YouTubeChannelData } from '@/lib/types';
import { formatFollowerCount, getMilestoneInfo } from '@/lib/channel';
import OdometerCounter from './OdometerCounter';

interface YouTubeLiveCounterProps {
  channel: YouTubeChannelData;
  onReset: () => void;
}

const DIGIT_COLORS = [
  { name: 'Classic White', hex: '#ffffff' },
  { name: 'YouTube Red', hex: '#FF0033' },
  { name: 'Crimson Flame', hex: '#FF3B30' },
  { name: 'Gold Yellow', hex: '#FFC107' },
  { name: 'Neon Cyan', hex: '#00E5FF' },
  { name: 'Hot Pink', hex: '#FF2A85' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Vibrant Orange', hex: '#FF9500' },
  { name: 'WhatsApp Green', hex: '#25D366' },
  { name: 'Sky Blue', hex: '#38BDF8' },
];

const POLL_INTERVAL = 3500; // 3.5 seconds real-time polling

function formatCompactCount(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('en-US');
}

export default function YouTubeLiveCounter({
  channel: initialChannel,
  onReset,
}: YouTubeLiveCounterProps) {
  const [channel, setChannel] = useState<YouTubeChannelData>(initialChannel);
  const [prevCount, setPrevCount] = useState<number | null>(null);
  const [countChanged, setCountChanged] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Customization state
  const [digitColor, setDigitColor] = useState<string>('#ffffff');
  const [showRealTime, setShowRealTime] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [shareTooltip, setShareTooltip] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  // Milestone celebration state
  const [achievedMilestone, setAchievedMilestone] = useState<string | null>(null);
  const [isExitingMilestone, setIsExitingMilestone] = useState<boolean>(false);
  const milestoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerMilestoneCelebration = (formattedTarget?: string) => {
    if (milestoneTimerRef.current) clearTimeout(milestoneTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

    const targetText = formattedTarget || getMilestoneInfo(channel.subscribers).formattedTarget;
    setAchievedMilestone(targetText);
    setIsExitingMilestone(false);

    milestoneTimerRef.current = setTimeout(() => {
      setIsExitingMilestone(true);
      exitTimerRef.current = setTimeout(() => {
        setAchievedMilestone(null);
        setIsExitingMilestone(false);
      }, 600);
    }, 3500);
  };

  const dismissMilestoneCelebration = () => {
    if (milestoneTimerRef.current) clearTimeout(milestoneTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    setIsExitingMilestone(true);
    exitTimerRef.current = setTimeout(() => {
      setAchievedMilestone(null);
      setIsExitingMilestone(false);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (milestoneTimerRef.current) clearTimeout(milestoneTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedColor = localStorage.getItem('yt_counter_digit_color');
      if (savedColor) setDigitColor(savedColor);

      const savedShowClock = localStorage.getItem('yt_counter_show_clock');
      if (savedShowClock !== null) setShowRealTime(savedShowClock === 'true');
    } catch {
      // ignore
    }
  }, []);

  const handleColorChange = (hex: string) => {
    setDigitColor(hex);
    try {
      localStorage.setItem('yt_counter_digit_color', hex);
    } catch {
      // ignore
    }
  };

  const handleToggleRealTime = () => {
    setShowRealTime((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('yt_counter_show_clock', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleResetSettings = () => {
    setDigitColor('#ffffff');
    setShowRealTime(false);
    try {
      localStorage.removeItem('yt_counter_digit_color');
      localStorage.removeItem('yt_counter_show_clock');
    } catch {
      // ignore
    }
  };

  // Share YouTube counter link
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/yt/${channel.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${channel.name} — Live YouTube Subscriber Count`,
          text: `Check out ${channel.name}'s live YouTube subscriber count in real time!`,
          url: shareUrl,
        });
        return;
      } catch {
        // fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setShareTooltip(true);
    setTimeout(() => setShareTooltip(false), 2000);
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

  const subscribersRef = useRef(channel.subscribers);
  useEffect(() => {
    subscribersRef.current = channel.subscribers;
  }, [channel.subscribers]);

  // Periodic polling for live subscriber updates
  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch(
          `/api/youtube?id=${encodeURIComponent(channel.id)}`,
          { cache: 'no-store' }
        );
        const data = await res.json();

        if (data.success && data.channel) {
          const newCount = data.channel.subscribers;
          const currentSubs = subscribersRef.current;

          if (newCount !== currentSubs) {
            const oldMilestone = getMilestoneInfo(currentSubs);
            const newMilestone = getMilestoneInfo(newCount);

            if (newCount >= oldMilestone.target || newMilestone.target > oldMilestone.target) {
              triggerMilestoneCelebration(oldMilestone.formattedTarget);
            }

            setPrevCount(currentSubs);
            setCountChanged(true);
            setTimeout(() => setCountChanged(false), 1200);
          }
          setChannel(data.channel);
        }
      } catch {
        // retry silently on next interval
      }
    }

    intervalRef.current = setInterval(refresh, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id]);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Header with Channel Info & Change Button */}
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
              background: 'linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
              border: '2px solid rgba(255, 0, 51, 0.45)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            {channel.picture && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={channel.picture}
                alt={`${channel.name} channel avatar`}
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
                {channel.name ? channel.name.charAt(0) : 'Y'}
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
                <span
                  title="Verified YouTube Channel"
                  style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff0033">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              YouTube Channel
            </p>
          </div>
        </div>

        {/* Change Channel Button */}
        <button
          id="yt-reset-btn"
          onClick={onReset}
          title="Search another YouTube channel"
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

      {/* Subscriber Odometer Display */}
      <div style={{ textAlign: 'center', marginBottom: '20px', width: '100%', overflow: 'hidden' }}>
        <div
          id="yt-subscriber-count"
          style={{
            padding: '12px 0',
            width: '100%',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <OdometerCounter
            value={channel.subscribers}
            fontSize="clamp(36px, 11vw, 84px)"
            digitColor={digitColor}
            glowColor="rgba(255, 0, 51, 0.38)"
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
          Live Subscribers
        </p>

        {/* Dynamic Delta Indicator */}
        {/* Fixed-height slot so the layout never shifts when the delta appears */}
        <div style={{ height: '20px', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {countChanged && prevCount !== null && (
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: '700',
                lineHeight: '20px',
                color: channel.subscribers >= prevCount ? 'var(--green-light)' : 'var(--error)',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              {channel.subscribers >= prevCount
                ? `▲ +${formatFollowerCount(channel.subscribers - prevCount)}`
                : `▼ -${formatFollowerCount(prevCount - channel.subscribers)}`}
            </p>
          )}
        </div>
      </div>

      {/* Secondary YouTube Metrics Grid (Total Views, Videos, Public API Subs) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.025)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '14px',
            padding: '10px 8px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: '700',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '4px',
            }}
          >
            Total Views
          </div>
          <div
            style={{
              fontSize: 'clamp(12px, 3vw, 15px)',
              fontWeight: '800',
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {channel.views > 0 ? formatCompactCount(channel.views) : '—'}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.025)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '14px',
            padding: '10px 8px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: '700',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '4px',
            }}
          >
            Videos
          </div>
          <div
            style={{
              fontSize: 'clamp(12px, 3vw, 15px)',
              fontWeight: '800',
              color: '#ffffff',
            }}
          >
            {channel.videos > 0 ? channel.videos.toLocaleString('en-US') : '—'}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.025)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '14px',
            padding: '10px 8px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: '700',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '4px',
            }}
          >
            API Count
          </div>
          <div
            style={{
              fontSize: 'clamp(12px, 3vw, 15px)',
              fontWeight: '800',
              color: 'var(--red-light)',
            }}
          >
            {formatCompactCount(channel.apiSubscribers)}
          </div>
        </div>
      </div>

      {/* Next Milestone Card (Red Theme) */}
      {(() => {
        const milestone = getMilestoneInfo(channel.subscribers);
        return (
          <div
            id="yt-channel-milestone-card"
            style={{
              background:
                'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 0, 51, 0.07) 100%)',
              border: '1px solid rgba(255, 0, 51, 0.25)',
              borderRadius: '16px',
              padding: '14px 16px',
              marginBottom: '20px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                marginBottom: '10px',
              }}
            >
              {/* Icon & Milestone Text */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'rgba(255, 0, 51, 0.15)',
                    border: '1px solid rgba(255, 0, 51, 0.32)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ff0033"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em',
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    Next Milestone:{' '}
                    <span style={{ color: 'var(--red-light)', fontWeight: '800' }}>
                      <span className="milestone-full">{milestone.formattedTarget}</span>
                      <span className="milestone-short">{milestone.shortTarget}</span>
                    </span>
                  </span>
                </div>
              </div>

              {/* Subscribers needed badge */}
              <div
                style={{
                  padding: '3px 10px',
                  background: 'rgba(255, 0, 51, 0.14)',
                  border: '1px solid rgba(255, 0, 51, 0.32)',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--red-light)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <span className="milestone-full">{milestone.formattedNeeded}</span>
                <span className="milestone-short">{milestone.shortNeeded}</span> needed
              </div>
            </div>

            {/* Progress Bar Container */}
            <div style={{ width: '100%', position: 'relative' }}>
              <div
                style={{
                  width: '100%',
                  height: '7px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: `${milestone.progressPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #b30000 0%, #ff0033 100%)',
                    borderRadius: '999px',
                    boxShadow: '0 0 8px rgba(255, 0, 51, 0.5)',
                    transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Progress to milestone</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>
                  {milestone.progressPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bottom Container Bar: LIVE Status, Real-Life Time Display, Share & Settings */}
      <div
        className="live-counter-bottom-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '10px 12px',
          position: 'relative',
        }}
      >
        {/* Left: Red LIVE Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'rgba(255, 0, 51, 0.14)',
              border: '1px solid rgba(255, 0, 51, 0.35)',
              borderRadius: '999px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--red)',
                display: 'inline-block',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: '800',
                color: 'var(--red)',
                letterSpacing: '0.1em',
              }}
            >
              LIVE
            </span>
          </div>
        </div>

        {/* Center: Real-Life Time (when toggled on) */}
        {showRealTime && (
          <div
            id="yt-real-life-time-display"
            className="mobile-time-display"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#ffffff',
              fontFamily: "'Inter', monospace",
              letterSpacing: '0.04em',
              animation: 'fadeIn 0.2s ease',
              whiteSpace: 'nowrap',
              flexShrink: 1,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <span style={{ fontSize: '10px', color: 'var(--red)' }}>🕒</span>
            <span>{currentTime}</span>
          </div>
        )}

        {/* Right: Share + Settings buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Share Button */}
          <div style={{ position: 'relative' }}>
            <button
              id="yt-share-btn"
              onClick={handleShare}
              title="Share this channel's live counter"
              aria-label="Share channel"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: shareTooltip ? 'rgba(255, 0, 51, 0.18)' : 'rgba(255,255,255,0.06)',
                border: shareTooltip ? '1px solid var(--red)' : '1px solid rgba(255,255,255,0.12)',
                color: shareTooltip ? 'var(--red)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!shareTooltip) {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                }
              }}
              onMouseLeave={(e) => {
                if (!shareTooltip) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                }
              }}
            >
              {shareTooltip ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              )}
            </button>

            {shareTooltip && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '44px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '4px 10px',
                  background: 'rgba(15, 18, 26, 0.95)',
                  border: '1px solid rgba(255, 0, 51, 0.35)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--red-light)',
                  whiteSpace: 'nowrap',
                  animation: 'fadeIn 0.15s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  zIndex: 50,
                }}
              >
                Link copied!
              </div>
            )}
          </div>

          {/* Settings Button */}
          <div style={{ position: 'relative' }} ref={settingsRef}>
            <button
              id="yt-settings-btn"
              onClick={() => setSettingsOpen((prev) => !prev)}
              title="Customize digit colors & clock"
              aria-label="Customize settings"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: settingsOpen ? 'rgba(255, 0, 51, 0.18)' : 'rgba(255,255,255,0.06)',
                border: settingsOpen ? '1px solid var(--red)' : '1px solid rgba(255,255,255,0.12)',
                color: settingsOpen ? 'var(--red)' : 'var(--text-secondary)',
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

            {/* Settings Popover: 10 Colors & Real-Life Time Toggle */}
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
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 0, 51, 0.25)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  zIndex: 50,
                  animation: 'popIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
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
                          border: isSelected
                            ? '2.5px solid #ffffff'
                            : '2px solid rgba(255,255,255,0.15)',
                          outline: isSelected ? '2px solid var(--red)' : 'none',
                          outlineOffset: '2px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                          boxShadow: isSelected
                            ? `0 0 12px ${col.hex}`
                            : '0 2px 6px rgba(0,0,0,0.3)',
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
                    id="yt-toggle-real-time-btn"
                    onClick={handleToggleRealTime}
                    aria-pressed={showRealTime}
                    title="Toggle real-life clock display in bottom bar"
                    style={{
                      width: '40px',
                      height: '22px',
                      borderRadius: '999px',
                      background: showRealTime ? 'var(--red)' : 'rgba(255, 255, 255, 0.18)',
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

                <div
                  style={{
                    height: '1px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    margin: '10px 0',
                  }}
                />

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
      </div>

      {/* Milestone Achieved Celebration Overlay (Red Theme) */}
      {achievedMilestone && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation: isExitingMilestone
              ? 'milestoneBackdropFadeOut 0.5s ease forwards'
              : 'milestoneBackdropFadeIn 0.4s ease forwards',
          }}
          onClick={dismissMilestoneCelebration}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '420px',
              background:
                'linear-gradient(145deg, rgba(28, 16, 24, 0.96) 0%, rgba(12, 10, 18, 0.98) 100%)',
              border: '1px solid rgba(255, 0, 51, 0.45)',
              borderRadius: '24px',
              padding: '32px 24px 28px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85), 0 0 50px rgba(255, 0, 51, 0.25)',
              animation: isExitingMilestone
                ? 'milestoneZoomOut 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                : 'milestonePopIn 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, rgba(255, 0, 51, 0.35) 0%, rgba(255, 193, 7, 0.2) 45%, transparent 70%)',
                pointerEvents: 'none',
                animation: 'pulseGlow 2s ease-in-out infinite',
              }}
            />

            <button
              onClick={dismissMilestoneCelebration}
              title="Close milestone notification"
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              ✕
            </button>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                position: 'relative',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://raw.githubusercontent.com/Agentx-max/techkey_emoji/main/Activity/Party%20Popper.webp"
                alt="Party Popper"
                className="milestone-party-popper"
                style={{
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))',
                  animation: 'popperBounce 1.6s ease-in-out infinite alternate',
                }}
              />
            </div>

            <div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 14px',
                  background:
                    'linear-gradient(135deg, rgba(255, 0, 51, 0.22) 0%, rgba(255, 193, 7, 0.2) 100%)',
                  border: '1px solid rgba(255, 0, 51, 0.45)',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#ff4d6d',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                🎉 MILESTONE ACHIEVED 🎉
              </span>
            </div>

            <h3
              style={{
                margin: '4px 0 8px',
                fontSize: 'clamp(22px, 5vw, 28px)',
                fontWeight: '800',
                color: '#ffffff',
                lineHeight: '1.2',
                letterSpacing: '-0.02em',
              }}
            >
              {achievedMilestone} Subscribers!
            </h3>

            <p
              style={{
                margin: 0,
                fontSize: '13.5px',
                color: 'var(--text-secondary)',
                lineHeight: '1.5',
              }}
            >
              Congratulations!{' '}
              <span style={{ color: '#ffffff', fontWeight: '600' }}>{channel.name}</span> has
              officially reached{' '}
              <strong style={{ color: 'var(--red-light)' }}>{achievedMilestone}</strong> live
              subscribers!
            </p>
          </div>
        </div>
      )}

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
        @keyframes milestonePopIn {
          0% { opacity: 0; transform: scale(0.3) translateY(20px); }
          60% { opacity: 1; transform: scale(1.08) translateY(-4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes milestoneZoomOut {
          0% { opacity: 1; transform: scale(1) translateY(0); }
          30% { opacity: 0.9; transform: scale(1.06) translateY(-4px); }
          100% { opacity: 0; transform: scale(0.1) translateY(30px); }
        }
        @keyframes milestoneBackdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes milestoneBackdropFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes popperBounce {
          0% { transform: translateY(0) rotate(-5deg) scale(1); }
          100% { transform: translateY(-10px) rotate(6deg) scale(1.06); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.25); }
        }
        .milestone-party-popper {
          width: 90px;
          height: 90px;
        }
        @media (max-width: 768px) {
          .milestone-party-popper {
            width: 70px;
            height: 70px;
          }
        }
        @media (max-width: 480px) {
          .milestone-party-popper {
            width: 60px;
            height: 60px;
          }
        }
        @media (max-width: 400px) {
          .live-counter-bottom-bar {
            padding: 8px 10px !important;
            gap: 6px !important;
          }
          .mobile-time-display {
            font-size: 10px !important;
            padding: 3px 6px !important;
          }
        }
      `}</style>
    </div>
  );
}

