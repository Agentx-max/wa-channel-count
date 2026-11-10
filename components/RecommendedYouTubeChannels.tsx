'use client';

import { useEffect, useState } from 'react';

interface YTChannelEntry {
  name: string;
  channelId: string;
  url: string;
  avatarColor: string;
}

interface YTChannelWithData extends YTChannelEntry {
  count: number | null;
  picture: string | null;
  verified: boolean;
  loading: boolean;
}

const RAW_YT_CHANNELS: YTChannelEntry[] = [
  {
    name: 'MrBeast',
    channelId: 'UCX6OQ3DkcsbYNE6H8uQQuVA',
    url: 'https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA',
    avatarColor: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
  },
  {
    name: 'T-Series',
    channelId: 'UCq-Fj5jknLsUf-MWSy4_brA',
    url: 'https://www.youtube.com/channel/UCq-Fj5jknLsUf-MWSy4_brA',
    avatarColor: 'linear-gradient(135deg, #ff0033 0%, #b30000 100%)',
  },
  {
    name: 'PewDiePie',
    channelId: 'UC-lHJZR3Gqxm24_Vd_AJ5Yw',
    url: 'https://www.youtube.com/channel/UC-lHJZR3Gqxm24_Vd_AJ5Yw',
    avatarColor: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
  },
  {
    name: 'Marques Brownlee',
    channelId: 'UCBJycsmduvYEL83R_U4JriQ',
    url: 'https://www.youtube.com/channel/UCBJycsmduvYEL83R_U4JriQ',
    avatarColor: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
  },
  {
    name: 'UR Cristiano',
    channelId: 'UCtxD0x6AuNNqdXO9Wp5GHew',
    url: 'https://www.youtube.com/channel/UCtxD0x6AuNNqdXO9Wp5GHew',
    avatarColor: 'linear-gradient(135deg, #845ec2 0%, #d65db1 100%)',
  },
  {
    name: 'IShowSpeed',
    channelId: 'UCWsDFcIhY2DBi3GB5uykGXA',
    url: 'https://www.youtube.com/channel/UCWsDFcIhY2DBi3GB5uykGXA',
    avatarColor: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
  },
];

function formatCount(c: number | null): string {
  if (c === null) return '...';
  if (c >= 1_000_000) return `${(c / 1_000_000).toFixed(2)}M`;
  if (c >= 10_000) return `${(c / 1_000).toFixed(1)}K`;
  return c.toLocaleString('en-US');
}

function VerifiedBadgeRed() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#ff0033" style={{ flexShrink: 0 }}>
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

function YTChannelRow({ channel, index }: { channel: YTChannelWithData; index: number }) {
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

  const handleTrack = () => {
    window.dispatchEvent(
      new CustomEvent('yt-track-channel', { detail: { id: channel.channelId } })
    );
  };

  const rankColors = [
    { bg: 'linear-gradient(135deg, #FFE000 0%, #FFB300 100%)', text: '#000', label: '1' },
    { bg: 'linear-gradient(135deg, #E0E0E0 0%, #F5F5F5 100%)', text: '#111', label: '2' },
    { bg: 'linear-gradient(135deg, #E65C00 0%, #F9D423 100%)', text: '#fff', label: '3' },
  ];
  const currentRank = rankColors[index] || {
    bg: 'rgba(255,255,255,0.06)',
    text: 'var(--text-muted)',
    label: `${index + 1}`,
  };

  const initialChar = channel.name.charAt(0).toUpperCase() || '▶';

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
        onClick={handleTrack}
        title={`Track ${channel.name} live`}
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
          border: '1px solid rgba(255, 0, 51, 0.25)',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        {channel.picture && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={channel.picture}
            alt={channel.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
            {initialChar}
          </span>
        )}
      </div>

      {/* Channel Info (Name + Subscribers) */}
      <div
        onClick={handleTrack}
        style={{ flex: 1, minWidth: 0, overflow: 'hidden', cursor: 'pointer' }}
      >
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
          {channel.verified && <VerifiedBadgeRed />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: channel.loading ? 'var(--text-muted)' : 'var(--red)',
              boxShadow: channel.loading ? 'none' : '0 0 6px var(--red)',
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
            {channel.loading ? 'Updating count...' : `${formatCount(channel.count)} subscribers`}
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
            background: copied ? 'rgba(255, 0, 51, 0.18)' : 'rgba(255,255,255,0.04)',
            color: copied ? 'var(--red)' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>

        {/* Track Live Button */}
        <button
          type="button"
          onClick={handleTrack}
          style={{
            padding: '6px 12px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%)',
            border: 'none',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: '700',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px var(--red-glow)',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <span>Track</span>
        </button>
      </div>
    </div>
  );
}

export default function RecommendedYouTubeChannels() {
  const [channels, setChannels] = useState<YTChannelWithData[]>(() =>
    RAW_YT_CHANNELS.map((ch) => ({
      ...ch,
      count: null,
      picture: null,
      verified: true,
      loading: true,
    }))
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchYTData(ch: YTChannelEntry, maxRetries = 2) {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (cancelled) return null;
        try {
          const res = await fetch(
            `/api/youtube?id=${encodeURIComponent(ch.channelId)}`,
            { cache: 'no-store' }
          );
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.channel) {
              return {
                channelId: ch.channelId,
                name: data.channel.name as string,
                count: data.channel.subscribers as number,
                picture: data.channel.picture as string | null,
                verified: Boolean(data.channel.verified),
              };
            }
          }
          if (attempt < maxRetries - 1) {
            await new Promise((r) => setTimeout(r, 600));
          }
        } catch {
          if (attempt < maxRetries - 1) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }
      return null;
    }

    const loadChannels = async () => {
      for (let i = 0; i < RAW_YT_CHANNELS.length; i++) {
        if (cancelled) break;
        const ch = RAW_YT_CHANNELS[i];

        if (i > 0 && i % 2 === 0) {
          await new Promise((r) => setTimeout(r, 150));
        }

        fetchYTData(ch).then((result) => {
          if (cancelled) return;
          setChannels((prev) => {
            const updated = prev.map((item) => {
              if (item.channelId === ch.channelId) {
                if (result) {
                  return {
                    ...item,
                    name: result.name || item.name,
                    count: result.count,
                    picture: result.picture,
                    verified: result.verified,
                    loading: false,
                  };
                }
                return { ...item, loading: false };
              }
              return item;
            });

            return [...updated].sort((a, b) => {
              if (a.count === null && b.count === null) return 0;
              if (a.count === null) return 1;
              if (b.count === null) return -1;
              return b.count - a.count;
            });
          });
        });
      }
    };

    loadChannels();

    const interval = setInterval(() => {
      if (!cancelled) loadChannels();
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <section
      className="rec-channel-card"
      style={{
        width: '100%',
        marginTop: '28px',
        background: 'var(--surface)',
        border: '1px solid rgba(255, 0, 51, 0.14)',
        borderRadius: '24px',
        padding: '20px 18px',
        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '17px',
              flexShrink: 0,
              boxShadow: '0 4px 14px var(--red-glow)',
            }}
          >
            🔥
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '700',
                color: '#ffffff',
                letterSpacing: '-0.3px',
              }}
            >
              Top YouTube Channels
            </h2>
            <p style={{ margin: '1px 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Popular channels ranked by real-time subscribers
            </p>
          </div>
        </div>

        <span
          className="mobile-hide"
          style={{
            fontSize: '10.5px',
            fontWeight: '700',
            color: 'var(--red-light)',
            padding: '4px 9px',
            borderRadius: '20px',
            background: 'rgba(255, 0, 51, 0.1)',
            border: '1px solid rgba(255, 0, 51, 0.25)',
            letterSpacing: '0.05em',
          }}
        >
          LIVE RANKINGS
        </span>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {channels.map((ch, i) => (
          <YTChannelRow key={ch.channelId} channel={ch} index={i} />
        ))}
      </div>
    </section>
  );
}

