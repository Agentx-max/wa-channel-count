'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type CounterPlatform = 'whatsapp' | 'youtube' | 'tiktok' | 'twitter';

interface NavItem {
  id: CounterPlatform;
  label: string;
  subtitle: string;
  href: string;
  accent: string;
  bgGlow: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp Counter',
    subtitle: 'Live channel followers',
    href: '/',
    accent: '#25d366',
    bgGlow: 'rgba(37, 211, 102, 0.16)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    id: 'youtube',
    label: 'YouTube Counter',
    subtitle: 'Live channel subscribers',
    href: '/yt',
    accent: '#ff0033',
    bgGlow: 'rgba(255, 0, 51, 0.16)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    id: 'tiktok',
    label: 'TikTok Counter',
    subtitle: 'Live profile followers',
    href: '/tiktok',
    accent: '#00f2fe',
    bgGlow: 'rgba(0, 242, 254, 0.16)',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
  },
  {
    id: 'twitter',
    label: 'X (Twitter) Counter',
    subtitle: 'Live account followers',
    href: '/x',
    accent: '#ffffff',
    bgGlow: 'rgba(255, 255, 255, 0.12)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

// TikTok and X counters are not live yet; only list counters that exist.
const LIVE_NAV_ITEMS = NAV_ITEMS.filter((i) => i.id === 'whatsapp' || i.id === 'youtube');

interface CounterNavMenuProps {
  theme?: 'green' | 'red' | 'tiktok' | 'x';
}

export default function CounterNavMenu({ theme = 'green' }: CounterNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  const accentMap = {
    green: { color: '#25d366', bg: 'rgba(37, 211, 102, 0.14)', border: 'rgba(37, 211, 102, 0.35)', glow: 'rgba(37, 211, 102, 0.25)' },
    red: { color: '#ff0033', bg: 'rgba(255, 0, 51, 0.14)', border: 'rgba(255, 0, 51, 0.35)', glow: 'rgba(255, 0, 51, 0.25)' },
    tiktok: { color: '#00f2fe', bg: 'rgba(0, 242, 254, 0.14)', border: 'rgba(254, 9, 121, 0.4)', glow: 'rgba(0, 242, 254, 0.25)' },
    x: { color: '#ffffff', bg: 'rgba(255, 255, 255, 0.12)', border: 'rgba(255, 255, 255, 0.35)', glow: 'rgba(255, 255, 255, 0.2)' },
  };

  const activeTheme = accentMap[theme];

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

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: '18px',
        left: '18px',
        zIndex: 100,
      }}
    >
      {/* Hamburger Button */}
      <button
        id="counter-nav-hamburger"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Switch Live Counter"
        aria-label="Open counters navigation menu"
        aria-expanded={isOpen}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: isOpen ? activeTheme.bg : 'rgba(15, 18, 26, 0.82)',
          border: isOpen ? `1px solid ${activeTheme.color}` : '1px solid rgba(255, 255, 255, 0.1)',
          color: isOpen ? activeTheme.color : '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: isOpen ? `0 8px 24px ${activeTheme.glow}` : '0 4px 16px rgba(0, 0, 0, 0.45)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = activeTheme.border;
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
        {isOpen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="counter-nav-panel"
          role="menu"
          style={{
            position: 'absolute',
            top: '50px',
            left: 0,
            width: 'min(270px, calc(100vw - 36px))',
            background: 'rgba(13, 16, 24, 0.96)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            padding: '10px',
            boxShadow: `0 24px 64px rgba(0, 0, 0, 0.85), 0 0 0 1px ${activeTheme.border}`,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            animation: 'navMenuPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: '800',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '4px 8px 2px',
            }}
          >
            Live Counters
          </div>

          {LIVE_NAV_ITEMS.map((item) => {
            const isCurrent =
              item.href === '/'
                ? pathname === '/'
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '9px 11px',
                  borderRadius: '13px',
                  textDecoration: 'none',
                  background: isCurrent ? item.bgGlow : 'rgba(255, 255, 255, 0.02)',
                  border: isCurrent
                    ? `1px solid ${item.accent}66`
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '9px',
                      background:
                        item.id === 'tiktok'
                          ? 'linear-gradient(135deg, #00f2fe 0%, #ff0050 100%)'
                          : item.id === 'twitter'
                            ? '#000000'
                            : item.bgGlow,
                      border:
                        item.id === 'twitter'
                          ? '1px solid rgba(255,255,255,0.25)'
                          : `1px solid ${item.accent}44`,
                      color: item.id === 'tiktok' || item.id === 'twitter' ? '#ffffff' : item.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#ffffff',
                        lineHeight: '1.2',
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: '10.5px',
                        color: 'var(--text-muted)',
                        marginTop: '2px',
                      }}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                {isCurrent ? (
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: item.accent,
                      boxShadow: `0 0 8px ${item.accent}`,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>
                    →
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes navMenuPop {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
