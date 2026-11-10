'use client';

import { useState, useEffect, useRef } from 'react';

interface UpdateEntry {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  badge: 'NEW' | 'FEATURE' | 'SECURITY' | 'UPDATE';
}

const WEB_UPDATES: UpdateEntry[] = [
  {
    id: 'upd-2026-11-10-yt',
    title: 'YouTube Live Subscriber Tracker',
    description:
      'Added a dedicated red-themed real-time YouTube channel subscriber, view, and video counter powered by live streaming analytics.',
    date: 'Nov 10, 2026',
    time: '03:49 PM',
    badge: 'NEW',
  },
  {
    id: 'upd-2026-11-10-bell',
    title: 'Live Updates & Changelog Center',
    description:
      'Added the top-corner notification bell so you can track every new web feature, update, and improvement with exact date and time.',
    date: 'Nov 10, 2026',
    time: '03:49 PM',
    badge: 'NEW',
  },
  {
    id: 'upd-2026-10-02-seo',
    title: 'SEO & Social Preview Upgrade',
    description:
      'Added dynamic sitemap.xml, robots.txt, and rich OpenGraph preview cards for wacount.com channel links.',
    date: 'Oct 02, 2026',
    time: '06:49 PM',
    badge: 'UPDATE',
  },
  {
    id: 'upd-2026-09-29-sec',
    title: 'Active DOM Security Shield & Turnstile',
    description:
      'Deployed active SecurityGuard anti-injection protection and Cloudflare Turnstile verification to keep live tracking fast and safe.',
    date: 'Sep 29, 2026',
    time: '09:01 PM',
    badge: 'SECURITY',
  },
  {
    id: 'upd-2026-09-28-party',
    title: 'Milestone Celebration Animation',
    description:
      'Added a full-screen Party Popper celebration overlay whenever a tracked channel crosses its target follower milestone live.',
    date: 'Sep 28, 2026',
    time: '07:02 PM',
    badge: 'FEATURE',
  },
  {
    id: 'upd-2026-09-27-milestone',
    title: 'Next Milestone Progress Tracker',
    description:
      'Added dynamic milestone target calculation, remaining followers needed badge, and a real-time progress bar.',
    date: 'Sep 27, 2026',
    time: '11:24 PM',
    badge: 'FEATURE',
  },
  {
    id: 'upd-2026-09-27-share',
    title: 'Instant Channel Share Links & 5s Polling',
    description:
      'Upgraded live refresh speed to 5 seconds and added one-click shareable channel counter links.',
    date: 'Sep 27, 2026',
    time: '04:23 PM',
    badge: 'FEATURE',
  },
  {
    id: 'upd-2026-09-26-custom',
    title: '10 Digit Color Themes & Live Clock',
    description:
      'Added counter customization settings with 10 neon odometer digit color palettes and a real-time ticking clock toggle.',
    date: 'Sep 26, 2026',
    time: '01:57 PM',
    badge: 'FEATURE',
  },
  {
    id: 'upd-2026-09-25-rec',
    title: 'Recommended Channels Live Leaderboard',
    description:
      'Launched the auto-ranking leaderboard of top channels with real-time follower counts and verified badges.',
    date: 'Sep 25, 2026',
    time: '01:14 PM',
    badge: 'FEATURE',
  },
];

const LATEST_UPDATE_ID = WEB_UPDATES[0].id;
const STORAGE_KEY = 'wacount_last_seen_update';

interface UpdatesBellProps {
  theme?: 'green' | 'red';
}

export default function UpdatesBell({ theme = 'green' }: UpdatesBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const accentColor = theme === 'red' ? '#ff0033' : '#25d366';
  const accentDark = theme === 'red' ? '#b30000' : '#128c7e';
  const accentGlow = theme === 'red' ? 'rgba(255, 0, 51, 0.25)' : 'rgba(37, 211, 102, 0.25)';
  const accentBg = theme === 'red' ? 'rgba(255, 0, 51, 0.14)' : 'rgba(37, 211, 102, 0.14)';
  const accentBorder = theme === 'red' ? 'rgba(255, 0, 51, 0.35)' : 'rgba(37, 211, 102, 0.35)';

  useEffect(() => {
    try {
      const seenId = localStorage.getItem(STORAGE_KEY);
      if (seenId === LATEST_UPDATE_ID) {
        setHasUnread(false);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && hasUnread) {
      setHasUnread(false);
      try {
        localStorage.setItem(STORAGE_KEY, LATEST_UPDATE_ID);
      } catch {
        // ignore
      }
    }
  };

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const getBadgeStyle = (badge: UpdateEntry['badge']) => {
    switch (badge) {
      case 'NEW':
        return {
          bg: accentBg,
          border: accentBorder,
          color: accentColor,
        };
      case 'FEATURE':
        return {
          bg: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          color: '#38bdf8',
        };
      case 'SECURITY':
        return {
          bg: 'rgba(255, 183, 3, 0.12)',
          border: '1px solid rgba(255, 183, 3, 0.3)',
          color: '#ffb703',
        };
      case 'UPDATE':
      default:
        return {
          bg: 'rgba(168, 85, 247, 0.12)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          color: '#c084fc',
        };
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: '18px',
        right: '18px',
        zIndex: 100,
      }}
    >
      {/* Bell Icon Button */}
      <button
        id="updates-bell-btn"
        type="button"
        onClick={handleToggle}
        title="What's New — Web Updates & Features"
        aria-label="View recent web updates and new features"
        aria-expanded={isOpen}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: isOpen ? accentBg : 'rgba(15, 18, 26, 0.82)',
          border: isOpen ? `1px solid ${accentColor}` : '1px solid rgba(255, 255, 255, 0.1)',
          color: isOpen ? accentColor : '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: isOpen
            ? `0 8px 24px ${accentGlow}`
            : '0 4px 16px rgba(0, 0, 0, 0.45)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = accentBorder;
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#e2e8f0';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            animation: hasUnread ? 'bellRing 2.5s ease-in-out infinite' : 'none',
            transformOrigin: 'top center',
          }}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread Indicator Dot */}
        {hasUnread && (
          <span
            style={{
              position: 'absolute',
              top: '7px',
              right: '7px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: accentColor,
              boxShadow: `0 0 8px ${accentColor}`,
              border: '1.5px solid #0f121a',
            }}
          />
        )}
      </button>

      {/* Updates Dropdown Panel */}
      {isOpen && (
        <div
          id="updates-panel"
          role="dialog"
          aria-label="What's New Updates"
          style={{
            position: 'absolute',
            top: '50px',
            right: 0,
            width: 'min(360px, calc(100vw - 36px))',
            background: 'rgba(13, 16, 24, 0.96)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            boxShadow: `0 24px 64px rgba(0, 0, 0, 0.8), 0 0 0 1px ${accentBorder}`,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            overflow: 'hidden',
            animation: 'bellPanelPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Panel Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '9px',
                  background: `linear-gradient(135deg, ${accentColor} 0%, ${accentDark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: `0 4px 12px ${accentGlow}`,
                  flexShrink: 0,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#ffffff',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    What&apos;s New
                  </h3>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: '800',
                      padding: '2px 6px',
                      borderRadius: '999px',
                      background: accentBg,
                      border: `1px solid ${accentBorder}`,
                      color: accentColor,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {WEB_UPDATES.length} UPDATES
                  </span>
                </div>
                <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Latest features &amp; platform changelog
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close updates panel"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--text-muted)',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              ✕
            </button>
          </div>

          {/* Scrollable Updates Feed */}
          <div
            style={{
              maxHeight: '390px',
              overflowY: 'auto',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {WEB_UPDATES.map((item, idx) => {
              const badgeStyle = getBadgeStyle(item.badge);
              const isLatest = idx < 2;
              return (
                <div
                  key={item.id}
                  style={{
                    padding: '12px 13px',
                    borderRadius: '14px',
                    background: isLatest
                      ? 'rgba(255, 255, 255, 0.045)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: isLatest
                      ? `1px solid ${accentBorder}`
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    transition: 'background 0.2s ease',
                  }}
                >
                  {/* Top row: Badge + Date & Time */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      marginBottom: '6px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: '800',
                        letterSpacing: '0.07em',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        background: badgeStyle.bg,
                        border:
                          typeof badgeStyle.border === 'string' && badgeStyle.border.startsWith('1px')
                            ? badgeStyle.border
                            : `1px solid ${badgeStyle.border}`,
                        color: badgeStyle.color,
                      }}
                    >
                      {item.badge}
                    </span>

                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: '600',
                        color: 'var(--text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {item.date} • {item.time}
                    </span>
                  </div>

                  {/* Update Title */}
                  <h4
                    style={{
                      margin: '0 0 4px',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#ffffff',
                      lineHeight: '1.3',
                    }}
                  >
                    {item.title}
                  </h4>

                  {/* Update Description */}
                  <p
                    style={{
                      margin: 0,
                      fontSize: '11.5px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.45',
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bellPanelPop {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes bellRing {
          0%, 80%, 100% { transform: rotate(0deg); }
          84% { transform: rotate(12deg); }
          88% { transform: rotate(-10deg); }
          92% { transform: rotate(8deg); }
          96% { transform: rotate(-5deg); }
        }
      `}</style>
    </div>
  );
}

