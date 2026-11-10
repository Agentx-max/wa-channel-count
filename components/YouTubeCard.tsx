'use client';

import { useState, useEffect, useRef } from 'react';
import type { YouTubeChannelData } from '@/lib/types';
import YouTubeInput from '@/components/YouTubeInput';
import YouTubeLiveCounter from '@/components/YouTubeLiveCounter';

interface YouTubeCardProps {
  initialQuery?: string;
}

export default function YouTubeCard({ initialQuery }: YouTubeCardProps) {
  const [channel, setChannel] = useState<YouTubeChannelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const autoFetchedRef = useRef(false);

  // Auto-fetch when arriving from a share link (/yt/ID → /yt?id=...)
  useEffect(() => {
    if (initialQuery && !autoFetchedRef.current) {
      autoFetchedRef.current = true;
      handleAutoFetch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  // Listen for custom event from RecommendedYouTubeChannels if user clicks "Track"
  useEffect(() => {
    function handleTrackEvent(e: Event) {
      const customEvent = e as CustomEvent<{ id: string }>;
      if (customEvent.detail?.id) {
        handleAutoFetch(customEvent.detail.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    window.addEventListener('yt-track-channel', handleTrackEvent);
    return () => window.removeEventListener('yt-track-channel', handleTrackEvent);
  }, []);

  async function handleAutoFetch(queryOrId: string) {
    setIsLoading(true);
    setApiError(null);

    try {
      const res = await fetch(
        `/api/youtube?url=${encodeURIComponent(queryOrId)}`,
        { cache: 'no-store' }
      );
      const data = await res.json();

      if (data.success && data.channel) {
        setChannel(data.channel);
      } else {
        setApiError(data.error || 'Failed to load YouTube channel.');
        setChannel(null);
      }
    } catch {
      setApiError('Network error. Please check your connection and try again.');
      setChannel(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(queryOrUrl: string, token: string) {
    setIsLoading(true);
    setApiError(null);

    try {
      const res = await fetch(
        `/api/youtube?url=${encodeURIComponent(queryOrUrl)}&token=${encodeURIComponent(token)}`,
        { cache: 'no-store' }
      );
      const data = await res.json();

      if (data.success && data.channel) {
        setChannel(data.channel);
      } else {
        setApiError(data.error || 'Failed to load YouTube channel.');
        setChannel(null);
      }
    } catch {
      setApiError('Network error. Please check your connection and try again.');
      setChannel(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setChannel(null);
    setApiError(null);
  }

  return (
    <div
      id="yt-channel-card"
      style={{
        background: 'rgba(15, 18, 26, 0.85)',
        border: '1px solid rgba(255, 0, 51, 0.14)',
        borderRadius: '24px',
        padding: 'clamp(20px, 5vw, 36px)',
        width: '100%',
        maxWidth: channel ? '640px' : '520px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 0 0 1px rgba(255, 0, 51, 0.05), 0 24px 64px rgba(0,0,0,0.65)',
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {channel ? (
        <YouTubeLiveCounter channel={channel} onReset={handleReset} />
      ) : (
        <>
          <YouTubeInput onSubmit={handleSubmit} isLoading={isLoading} />

          {/* API error */}
          {apiError && (
            <div
              id="yt-api-error"
              style={{
                marginTop: '16px',
                padding: '14px 16px',
                background: 'rgba(255,68,68,0.07)',
                border: '1px solid rgba(255,68,68,0.2)',
                borderRadius: '12px',
                color: 'var(--error)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ flexShrink: 0, marginTop: '1px' }}
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>{apiError}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

