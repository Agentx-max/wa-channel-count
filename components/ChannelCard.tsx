'use client';

import { useState } from 'react';
import type { ChannelData, ApiResponse } from '@/lib/types';
import ChannelInput from '@/components/ChannelInput';
import LiveCounter from '@/components/LiveCounter';

export default function ChannelCard() {
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [channelUrl, setChannelUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  async function handleSubmit(url: string) {
    setIsLoading(true);
    setApiError(null);

    try {
      const res = await fetch(`/api/channel?url=${encodeURIComponent(url)}`, {
        cache: 'no-store',
      });
      const data: ApiResponse = await res.json();

      if (data.success) {
        setChannel(data.channel);
        setChannelUrl(url);
      } else {
        setApiError(data.error);
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
    setChannelUrl('');
    setApiError(null);
  }

  return (
    <div
      id="channel-card"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        padding: 'clamp(24px, 5vw, 40px)',
        width: '100%',
        maxWidth: channel ? '620px' : '520px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.02), 0 24px 60px rgba(0,0,0,0.5)',
        transition: 'all 0.3s ease',
      }}
    >
      {channel ? (
        <LiveCounter
          channel={channel}
          channelUrl={channelUrl}
          onReset={handleReset}
        />
      ) : (
        <>
          <ChannelInput onSubmit={handleSubmit} isLoading={isLoading} />

          {/* API error */}
          {apiError && (
            <div
              id="api-error"
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
