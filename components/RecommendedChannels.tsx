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
    name: 'Sinhala Subtitles.lk 🇱🇰',
    url: 'https://whatsapp.com/channel/0029Va94Yp07IUYSfK3G7t1m',
    inviteCode: '0029Va94Yp07IUYSfK3G7t1m',
    avatarColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
];

function formatCount(c: number | null): string {
  if (c === null) return '...';
  if (c >= 1_000_000) return `${(c / 1_000_000).toFixed(1)}M`;
  if (c >= 10_000) return `${(c / 1_000).toFixed(0)}K`;
  return c.toLocaleString('en-US');
}

function VerifiedBadge() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="#25D366"
      style={{ flexShrink: 0 }}
    >
      <title>Verified Channel</title>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
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

  const initialChar = Array.from(channel.name.replace(/[^a-zA-Z0-9\u0D80-\u0DFF]/g, ''))[0] || '📢';

  return (
    <div
      className="rec-channel-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {/* Rank badge */}
      <span
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '6px',
          background: currentRank.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: '800',
          color: currentRank.text,
          flexShrink: 0,
        }}
      >
        {currentRank.label}
      </span>

      {/* Channel Logo / Avatar */}
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '11px',
          overflow: 'hidden',
          background: channel.avatarColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.12)',
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
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
            {initialChar}
          </span>
        )}
      </div>

      {/* Channel Info (Name + Followers) */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: '13.5px',
              fontWeight: '600',
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '1.3',
              flex: 1,
              minWidth: 0,
            }}
          >
            {channel.name}
          </p>
          {channel.verified && <VerifiedBadge />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: channel.loading ? 'var(--text-muted)' : 'var(--green)',
              boxShadow: channel.loading ? 'none' : '0 0 6px var(--green)',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '11.5px',
              color: channel.loading ? 'var(--text-muted)' : 'var(--text-secondary)',
              fontWeight: '500',
              whiteSpace: 'nowrap',
            }}
          >
            {channel.loading ? 'Updating count...' : `${formatCount(channel.count)} followers`}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Copy Link */}
        <button
          onClick={handleCopy}
          title="Copy channel link"
          aria-label="Copy channel link"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: copied ? 'rgba(37,211,102,0.18)' : 'rgba(255,255,255,0.04)',
            color: copied ? 'var(--green)' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
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
            padding: '6px 12px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%)',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: '700',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px var(--green-glow)',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <span>Follow</span>
        </a>
      </div>
    </div>
  );
}

export default function RecommendedChannels() {
  const [channels, setChannels] = useState<ChannelWithData[]>(() =>
    RAW_CHANNELS.map((ch) => ({
      ...ch,
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
        RAW_CHANNELS.map(async (ch) => {
          const res = await fetch(`/api/channel?url=${encodeURIComponent(ch.url)}`);
          if (!res.ok) return { inviteCode: ch.inviteCode, count: null, picture: null, verified: false };
          const data = await res.json();
          if (data.success && data.channel) {
            return {
              inviteCode: ch.inviteCode,
              count: data.channel.followers as number,
              picture: data.channel.picture as string | null,
              verified: Boolean(data.channel.verified),
            };
          }
          return { inviteCode: ch.inviteCode, count: null, picture: null, verified: false };
        })
      );

      if (cancelled) return;

      setChannels((prev) => {
        const updated = prev.map((ch) => {
          const match = results.find(
            (r) => r.status === 'fulfilled' && r.value.inviteCode === ch.inviteCode
          );
          if (match && match.status === 'fulfilled') {
            return {
              ...ch,
              count: match.value.count,
              picture: match.value.picture,
              verified: match.value.verified,
              loading: false,
            };
          }
          return { ...ch, loading: false };
        });

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
      className="rec-channel-card"
      style={{
        width: '100%',
        marginTop: '28px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        padding: '20px 18px',
        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '17px',
              flexShrink: 0,
              boxShadow: '0 4px 14px var(--green-glow)',
            }}
          >
            🔥
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.3px' }}>
              Recommended Channels
            </h2>
            <p style={{ margin: '1px 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Top channels ranked by real-time followers
            </p>
          </div>
        </div>

        <span
          className="mobile-hide"
          style={{
            fontSize: '10.5px',
            fontWeight: '700',
            color: 'var(--green)',
            padding: '4px 9px',
            borderRadius: '20px',
            background: 'rgba(37, 211, 102, 0.1)',
            border: '1px solid rgba(37, 211, 102, 0.2)',
            letterSpacing: '0.05em',
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
