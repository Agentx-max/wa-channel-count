'use client';

import { useEffect, useState } from 'react';

interface ChannelEntry {
  name: string;
  url: string;
  inviteCode: string;
}

interface ChannelWithCount extends ChannelEntry {
  count: number | null;
  loading: boolean;
}

const RAW_CHANNELS: ChannelEntry[] = [
  {
    name: '🌎 TechKey 🔑 Digital World |🇱🇰',
    url: 'https://whatsapp.com/channel/0029VajWJmkAInPnfgGtrS2K',
    inviteCode: '0029VajWJmkAInPnfgGtrS2K',
  },
  {
    name: 'කාටූන් | සිංහල 💫⭐',
    url: 'https://whatsapp.com/channel/0029VbBvaPyB4hdP6Ut4zc15',
    inviteCode: '0029VbBvaPyB4hdP6Ut4zc15',
  },
  {
    name: 'CosmoVerse 🧬 Science World |🇱🇰',
    url: 'https://whatsapp.com/channel/0029VaMBo5N3wtb31nYJql3x',
    inviteCode: '0029VaMBo5N3wtb31nYJql3x',
  },
  {
    name: 'MED HUB 🩺🇱🇰',
    url: 'https://whatsapp.com/channel/0029VbCYfsK5Ejxyg18ecV0o',
    inviteCode: '0029VbCYfsK5Ejxyg18ecV0o',
  },
  {
    name: 'සත්‍ය හොල්මන් කතා 💀🇱🇰',
    url: 'https://whatsapp.com/channel/0029Vb8l9UqHVvTfUqgBg62m',
    inviteCode: '0029Vb8l9UqHVvTfUqgBg62m',
  },
  {
    name: 'සත්‍ය හොල්මන් කතා 💀🇱🇰 II',
    url: 'https://whatsapp.com/channel/0029Vb8i0FaDeONGPnRB820m',
    inviteCode: '0029Vb8i0FaDeONGPnRB820m',
  },
  {
    name: '🎬 TKCinema | ෆිල්ම් ගබඩාව 🍿🧚‍♀️',
    url: 'https://whatsapp.com/channel/0029VbDglEUL7UVPyJMXf82r',
    inviteCode: '0029VbDglEUL7UVPyJMXf82r',
  },
  {
    name: 'Astronomy Lanka 🇱🇰',
    url: 'https://whatsapp.com/channel/0029VaE3Jb7EKyZ8hCltnA3x',
    inviteCode: '0029VaE3Jb7EKyZ8hCltnA3x',
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChannelRow({ channel, index }: { channel: ChannelWithCount; index: number }) {
  const [copied, setCopied] = useState(false);

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

  const rankStyle: React.CSSProperties = {
    minWidth: '28px',
    height: '28px',
    borderRadius: '8px',
    background:
      index === 0
        ? 'linear-gradient(135deg,#f9d423,#f15f79)'
        : index === 1
        ? 'linear-gradient(135deg,#d0d0d0,#8a8a8a)'
        : index === 2
        ? 'linear-gradient(135deg,#cd7f32,#a05a20)'
        : 'rgba(255,255,255,0.07)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '700',
    color: index < 3 ? '#fff' : 'var(--text-muted)',
    flexShrink: 0,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '11px 14px',
        borderRadius: '14px',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        transition: 'background 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.055)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(37,211,102,0.2)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.025)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
      }}
    >
      <span style={rankStyle}>{index + 1}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '13.5px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {channel.name}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '12px', color: channel.loading ? 'var(--text-muted)' : 'var(--green)', fontWeight: '500' }}>
          {channel.loading ? 'Loading…' : `${formatCount(channel.count)} followers`}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>
        <button
          onClick={handleCopy}
          title="Copy channel link"
          aria-label="Copy channel link"
          style={{
            width: '33px',
            height: '33px',
            borderRadius: '9px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: copied ? 'rgba(37,211,102,0.15)' : 'rgba(255,255,255,0.04)',
            color: copied ? 'var(--green)' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>

        <a
          href={channel.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '6px 13px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%)',
            color: '#fff',
            fontSize: '12.5px',
            fontWeight: '700',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 10px var(--green-glow)',
            transition: 'opacity 0.2s, transform 0.15s',
            display: 'inline-block',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.82'; (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.05)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'; }}
        >
          Follow
        </a>
      </div>
    </div>
  );
}

export default function RecommendedChannels() {
  const [channels, setChannels] = useState<ChannelWithCount[]>(
    RAW_CHANNELS.map(c => ({ ...c, count: null, loading: true }))
  );

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      const results = await Promise.allSettled(
        RAW_CHANNELS.map(async ch => {
          const res = await fetch(`/api/channel?code=${encodeURIComponent(ch.inviteCode)}`);
          if (!res.ok) throw new Error('fetch failed');
          const data = await res.json();
          return { inviteCode: ch.inviteCode, count: (data.subscriberCount as number) ?? null };
        })
      );
      if (cancelled) return;

      const countMap: Record<string, number | null> = {};
      results.forEach((r, i) => {
        countMap[RAW_CHANNELS[i].inviteCode] = r.status === 'fulfilled' ? r.value.count : null;
      });

      setChannels(prev => {
        const updated = prev.map(ch => ({ ...ch, count: countMap[ch.inviteCode] ?? null, loading: false }));
        return [...updated].sort((a, b) => {
          if (a.count === null && b.count === null) return 0;
          if (a.count === null) return 1;
          if (b.count === null) return -1;
          return b.count - a.count;
        });
      });
    };
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  return (
    <section
      style={{
        width: '100%',
        marginTop: '28px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        padding: '22px 20px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '17px',
            flexShrink: 0,
            boxShadow: '0 4px 14px var(--green-glow)',
          }}
        >
          ⭐
        </span>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#fff', letterSpacing: '-0.3px' }}>
            Recommended Channels
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
            Sorted by live follower count
          </p>
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {channels.map((ch, i) => (
          <ChannelRow key={ch.inviteCode} channel={ch} index={i} />
        ))}
      </div>
    </section>
  );
}
