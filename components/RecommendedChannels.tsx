'use client';

import { useEffect, useState } from 'react';

interface ChannelEntry {
  name: string;
  url: string;
  inviteCode: string;
  avatarColor: string;
}

interface ChannelWithData extends ChannelEntry {
  count: number | null;
  picture: string | null;
  verified: boolean;
  loading: boolean;
}

const RAW_CHANNELS: ChannelEntry[] = [
  {
    name: '🌎 TechKey 🔑 Digital World |🇱🇰',
    url: 'https://whatsapp.com/channel/0029VajWJmkAInPnfgGtrS2K',
    inviteCode: '0029VajWJmkAInPnfgGtrS2K',
    avatarColor: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
  },
  {
    name: 'කාටූන් | සිංහල 💫⭐',
    url: 'https://whatsapp.com/channel/0029VbBvaPyB4hdP6Ut4zc15',
    inviteCode: '0029VbBvaPyB4hdP6Ut4zc15',
    avatarColor: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  },
  {
    name: 'CosmoVerse 🧬 Science World |🇱🇰',
    url: 'https://whatsapp.com/channel/0029VaMBo5N3wtb31nYJql3x',
    inviteCode: '0029VaMBo5N3wtb31nYJql3x',
    avatarColor: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  },
  {
    name: 'MED HUB 🩺🇱🇰',
    url: 'https://whatsapp.com/channel/0029VbCYfsK5Ejxyg18ecV0o',
    inviteCode: '0029VbCYfsK5Ejxyg18ecV0o',
    avatarColor: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
  },
  {
    name: 'සත්‍ය හොල්මන් කතා 💀🇱🇰',
    url: 'https://whatsapp.com/channel/0029Vb8l9UqHVvTfUqgBg62m',
    inviteCode: '0029Vb8l9UqHVvTfUqgBg62m',
    avatarColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
  {
    name: 'සත්‍ය හොල්මන් කතා 💀🇱🇰 II',
    url: 'https://whatsapp.com/channel/0029Vb8i0FaDeONGPnRB820m',
    inviteCode: '0029Vb8i0FaDeONGPnRB820m',
    avatarColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
  {
    name: '🎬 TKCinema | ෆිල්ම් ගබඩාව 🍿🧚‍♀️',
    url: 'https://whatsapp.com/channel/0029VbDglEUL7UVPyJMXf82r',
    inviteCode: '0029VbDglEUL7UVPyJMXf82r',
    avatarColor: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
  },
  {
    name: 'Astronomy Lanka 🇱🇰',
    url: 'https://whatsapp.com/channel/0029VaE3Jb7EKyZ8hCltnA3x',
    inviteCode: '0029VaE3Jb7EKyZ8hCltnA3x',
    avatarColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
];

function formatCount(n: number | null): string {
  if (n === null) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function VerifiedBadge() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--green)" style={{ flexShrink: 0 }}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}

function ChannelRow({ channel, index }: { channel: ChannelWithData; index: number }) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(channel.url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = channel.url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Rank styling
  const rankColors = [
    { bg: 'linear-gradient(135deg, #FFE000 0%, #799F0C 100%)', text: '#000', label: '1' },
    { bg: 'linear-gradient(135deg, #E0E0E0 0%, #F5F5F5 100%)', text: '#111', label: '2' },
    { bg: 'linear-gradient(135deg, #E65C00 0%, #F9D423 100%)', text: '#fff', label: '3' },
  ];
  const currentRank = rankColors[index] || {
    bg: 'rgba(255,255,255,0.06)',
    text: 'var(--text-muted)',
    label: `${index + 1}`,
  };

  // Fallback initial character for logo
  const initialChar = Array.from(channel.name.replace(/[^a-zA-Z0-9\u0D80-\u0DFF]/g, ''))[0] || '📢';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255, 255, 255, 0.05)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(37, 211, 102, 0.25)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255, 255, 255, 0.02)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255, 255, 255, 0.06)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Rank badge */}
      <span
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '7px',
          background: currentRank.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: '800',
          color: currentRank.text,
          flexShrink: 0,
          boxShadow: index < 3 ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        {currentRank.label}
      </span>

      {/* Channel Logo / Avatar */}
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          overflow: 'hidden',
          background: channel.avatarColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          position: 'relative',
        }}
      >
        {channel.picture && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={channel.picture}
            alt={channel.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
            {initialChar}
          </span>
        )}
      </div>

      {/* Channel Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '600',
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.2px',
            }}
          >
            {channel.name}
          </p>
          {channel.verified && <VerifiedBadge />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: channel.loading ? 'var(--text-muted)' : 'var(--green)',
              boxShadow: channel.loading ? 'none' : '0 0 8px var(--green)',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontSize: '12px',
              color: channel.loading ? 'var(--text-muted)' : 'var(--text-secondary)',
              fontWeight: '500',
            }}
          >
            {channel.loading ? 'Updating count...' : `${formatCount(channel.count)} followers`}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Copy Link */}
        <button
          onClick={handleCopy}
          title="Copy channel link"
          aria-label="Copy channel link"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: copied ? 'rgba(37,211,102,0.18)' : 'rgba(255,255,255,0.04)',
            color: copied ? 'var(--green)' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            if (!copied) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
            }
          }}
          onMouseLeave={e => {
            if (!copied) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
            }
          }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>

        {/* Follow Button */}
        <a
          href={channel.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '7px 14px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%)',
            color: '#ffffff',
            fontSize: '12.5px',
            fontWeight: '700',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 10px var(--green-glow)',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px) scale(1.03)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px var(--green-glow-strong)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0) scale(1)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 10px var(--green-glow)';
          }}
        >
          <span>Follow</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </a>
      </div>
    </div>
  );
}

export default function RecommendedChannels() {
  const [channels, setChannels] = useState<ChannelWithData[]>(
    RAW_CHANNELS.map(c => ({
      ...c,
      count: null,
      picture: null,
      verified: false,
      loading: true,
    }))
  );

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      const results = await Promise.allSettled(
        RAW_CHANNELS.map(async ch => {
          const res = await fetch(`/api/channel?url=${encodeURIComponent(ch.url)}`);
          if (!res.ok) throw new Error('fetch failed');
          const data = await res.json();
          if (data.success && data.channel) {
            return {
              inviteCode: ch.inviteCode,
              count: (data.channel.followers as number) ?? null,
              picture: (data.channel.picture as string) ?? null,
              verified: Boolean(data.channel.verified),
            };
          }
          throw new Error('invalid response');
        })
      );

      if (cancelled) return;

      const dataMap: Record<string, { count: number | null; picture: string | null; verified: boolean }> = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          dataMap[RAW_CHANNELS[i].inviteCode] = r.value;
        } else {
          dataMap[RAW_CHANNELS[i].inviteCode] = { count: null, picture: null, verified: false };
        }
      });

      setChannels(prev => {
        const updated = prev.map(ch => ({
          ...ch,
          count: dataMap[ch.inviteCode]?.count ?? null,
          picture: dataMap[ch.inviteCode]?.picture ?? null,
          verified: dataMap[ch.inviteCode]?.verified ?? false,
          loading: false,
        }));

        return [...updated].sort((a, b) => {
          if (a.count === null && b.count === null) return 0;
          if (a.count === null) return 1;
          if (b.count === null) return -1;
          return b.count - a.count;
        });
      });
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      style={{
        width: '100%',
        marginTop: '32px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        padding: '24px 20px',
        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              flexShrink: 0,
              boxShadow: '0 4px 16px var(--green-glow)',
            }}
          >
            🔥
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.3px' }}>
              Recommended Channels
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              Top channels ranked by real-time followers
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--green)',
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'rgba(37, 211, 102, 0.1)',
            border: '1px solid rgba(37, 211, 102, 0.2)',
          }}
        >
          LIVE RANKINGS
        </span>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {channels.map((ch, i) => (
          <ChannelRow key={ch.inviteCode} channel={ch} index={i} />
        ))}
      </div>
    </section>
  );
}
