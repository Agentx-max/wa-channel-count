'use client';

import React, { useState } from 'react';
import {
  CounterCustomization,
  COLOR_PALETTES,
  DEFAULT_CUSTOMIZATION,
  getFontFamilyCSS,
  getTextShadowCSS,
  playTickSound,
} from '@/lib/customization';

interface CounterCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customization: CounterCustomization;
  onChange: (updated: CounterCustomization) => void;
  onReset: () => void;
}

export default function CounterCustomizerModal({
  isOpen,
  onClose,
  customization,
  onChange,
  onReset,
}: CounterCustomizerModalProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'refresh' | 'glow' | 'typography' | 'animation'>('colors');
  const [resetNotice, setResetNotice] = useState(false);

  if (!isOpen) return null;

  const handleResetClick = () => {
    onReset();
    setResetNotice(true);
    setTimeout(() => setResetNotice(false), 2000);
  };

  const update = (partial: Partial<CounterCustomization>) => {
    onChange({ ...customization, ...partial });
  };

  const handlePaletteSelect = (paletteId: string) => {
    const found = COLOR_PALETTES.find((p) => p.id === paletteId);
    if (!found) return;
    update({
      colorPaletteId: found.id,
      digitColor: found.digitColor,
      glowColor: found.glowColor,
      isGradient: !!found.isGradient,
    });
  };

  const handleCustomHexChange = (hex: string) => {
    update({
      colorPaletteId: 'custom',
      customColorHex: hex,
      digitColor: hex,
      glowColor: hex,
      isGradient: false,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customizer-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeInModal 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#0e121b',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(37, 211, 102, 0.15)',
          overflow: 'hidden',
          animation: 'scaleUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
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
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px var(--green-glow)',
                color: '#ffffff',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
                <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            </div>
            <div>
              <h2
                id="customizer-title"
                style={{
                  fontSize: '17px',
                  fontWeight: '700',
                  color: '#ffffff',
                  letterSpacing: '-0.3px',
                  margin: 0,
                }}
              >
                Customize Counter
              </h2>
              <p style={{ margin: '1px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Personalize digit colors, refresh rates & styles
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close customizer"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Live Mini Preview Bar */}
        <div
          style={{
            padding: '12px 20px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              DIGIT PREVIEW:
            </span>
            <div
              style={{
                fontFamily: getFontFamilyCSS(customization.fontFamily),
                fontSize: '22px',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                ...(customization.isGradient
                  ? {
                      backgroundImage: customization.digitColor,
                      WebkitBackgroundImage: customization.digitColor,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter:
                        customization.glowIntensity === 'none'
                          ? 'none'
                          : `drop-shadow(0 0 8px ${customization.glowColor})`,
                    }
                  : {
                      color: customization.digitColor,
                      textShadow: getTextShadowCSS(customization.glowIntensity, customization.glowColor),
                    }),
              }}
            >
              12,450
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(37, 211, 102, 0.12)',
                color: 'var(--green)',
                fontWeight: '600',
              }}
            >
              ⏱️ {customization.pollIntervalMs / 1000}s refresh
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-secondary)',
                fontWeight: '600',
              }}
            >
              ✨ {customization.glowIntensity} glow
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '4px 12px 0',
            gap: '4px',
            overflowX: 'auto',
            background: 'rgba(255, 255, 255, 0.01)',
          }}
        >
          {[
            { id: 'colors', label: '🎨 Digit Colors', badge: 'Palettes' },
            { id: 'refresh', label: '⏱️ Refresh & Times', badge: `${customization.pollIntervalMs / 1000}s` },
            { id: 'glow', label: '✨ Glow & Aura', badge: customization.glowIntensity },
            { id: 'typography', label: '🔤 Font & Size', badge: customization.fontFamily },
            { id: 'animation', label: '⚡ Dynamics', badge: `${customization.animDurationMs}ms` },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px 8px 0 0',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--green)' : '2px solid transparent',
                  background: isActive ? 'rgba(37, 211, 102, 0.08)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: isActive ? '700' : '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* TAB 1: DIGIT COLORS ONLY */}
          {activeTab === 'colors' && (
            <div>
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(37, 211, 102, 0.08)',
                  border: '1px solid rgba(37, 211, 102, 0.2)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '18px' }}>🎯</span>
                <div>
                  <p style={{ margin: 0, fontSize: '12.5px', fontWeight: '700', color: '#ffffff' }}>
                    Digit Colors Only
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
                    These palettes style the numbers and glowing aura. The card container stays clean and dark.
                  </p>
                </div>
              </div>

              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px', letterSpacing: '0.05em' }}>
                CURATED COLOR PALETTES
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '10px',
                  marginBottom: '20px',
                }}
              >
                {COLOR_PALETTES.map((palette) => {
                  const isSelected =
                    customization.colorPaletteId === palette.id &&
                    !customization.colorPaletteId.startsWith('custom');

                  return (
                    <button
                      key={palette.id}
                      onClick={() => handlePaletteSelect(palette.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '14px',
                        background: isSelected
                          ? 'rgba(37, 211, 102, 0.12)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected
                          ? '1.5px solid var(--green)'
                          : '1px solid rgba(255, 255, 255, 0.07)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.18s ease',
                        boxShadow: isSelected ? '0 4px 16px rgba(37, 211, 102, 0.2)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                        }
                      }}
                    >
                      <span
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: palette.preview,
                          flexShrink: 0,
                          boxShadow: `0 0 10px ${palette.glowColor}80`,
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          display: 'inline-block',
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '12px',
                            fontWeight: '700',
                            color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {palette.name}
                        </p>
                        <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)' }}>
                          {palette.isGradient ? 'Gradient' : palette.digitColor}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Picker */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                    Custom Digit Hex Color
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Pick any custom color for the live numbers
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={
                      customization.digitColor.startsWith('#')
                        ? customization.digitColor
                        : customization.customColorHex || '#25D366'
                    }
                    onChange={(e) => handleCustomHexChange(e.target.value)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      background: 'none',
                    }}
                    title="Choose custom digit color"
                  />
                  <input
                    type="text"
                    value={
                      customization.digitColor.startsWith('#')
                        ? customization.digitColor
                        : customization.customColorHex || '#25D366'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith('#') && (val.length === 4 || val.length === 7)) {
                        handleCustomHexChange(val);
                      }
                    }}
                    placeholder="#25D366"
                    style={{
                      width: '90px',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: '600',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REFRESH RATE & TIMESTAMPS */}
          {activeTab === 'refresh' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                    POLLING REFRESH RATE
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: '700' }}>
                    Active: {customization.pollIntervalMs / 1000}s
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  {[
                    { ms: 1000, label: '1s', note: 'Turbo' },
                    { ms: 2000, label: '2s', note: 'Fast' },
                    { ms: 3000, label: '3s', note: 'Quick' },
                    { ms: 5000, label: '5s', note: 'Default' },
                    { ms: 10000, label: '10s', note: 'Relaxed' },
                    { ms: 15000, label: '15s', note: 'Steady' },
                    { ms: 30000, label: '30s', note: 'Battery' },
                    { ms: 60000, label: '60s', note: '1 min' },
                  ].map((rate) => {
                    const isSelected = customization.pollIntervalMs === rate.ms;
                    return (
                      <button
                        key={rate.ms}
                        onClick={() => update({ pollIntervalMs: rate.ms })}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '12px',
                          background: isSelected
                            ? 'var(--green)'
                            : 'rgba(255, 255, 255, 0.04)',
                          color: isSelected ? '#000000' : 'var(--text-primary)',
                          border: isSelected
                            ? '1px solid var(--green)'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          fontWeight: isSelected ? '800' : '600',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        <span>{rate.label}</span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            opacity: isSelected ? 0.8 : 0.5,
                            fontWeight: '500',
                          }}
                        >
                          {rate.note}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Timestamp Display Options */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', letterSpacing: '0.05em' }}>
                  TIMESTAMP DISPLAY FORMAT
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    { id: 'relative', title: 'Relative Time', sample: 'Updated 4s ago' },
                    { id: 'exact', title: 'Exact Clock Time', sample: '08:42:15 PM' },
                    { id: 'both', title: 'Full (Both)', sample: '08:42:15 PM · 4s ago' },
                    { id: 'hidden', title: 'Clean / Minimal', sample: 'LIVE only' },
                  ].map((format) => {
                    const isSelected = customization.timestampFormat === format.id;
                    return (
                      <button
                        key={format.id}
                        onClick={() => update({ timestampFormat: format.id as typeof customization.timestampFormat })}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '14px',
                          background: isSelected
                            ? 'rgba(37, 211, 102, 0.1)'
                            : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected
                            ? '1.5px solid var(--green)'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <p style={{ margin: 0, fontSize: '12.5px', fontWeight: '700' }}>
                          {format.title}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: isSelected ? 'var(--green)' : 'var(--text-muted)' }}>
                          {format.sample}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Auto Refresh Toggle */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                    Auto-Polling Active
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Automatically fetch live subscriber counts in the background
                  </p>
                </div>

                <button
                  onClick={() => update({ autoRefreshEnabled: !customization.autoRefreshEnabled })}
                  style={{
                    width: '46px',
                    height: '26px',
                    borderRadius: '999px',
                    background: customization.autoRefreshEnabled ? 'var(--green)' : 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: customization.autoRefreshEnabled ? '23px' : '3px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: GLOW & AURA */}
          {activeTab === 'glow' && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px', letterSpacing: '0.05em' }}>
                DIGIT GLOW INTENSITY
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                {[
                  { id: 'none', title: 'Flat Clean', note: 'No glow or aura shadow', icon: '🌑' },
                  { id: 'subtle', title: 'Subtle Aura', note: 'Smooth ambient glow', icon: '✨' },
                  { id: 'neon', title: 'Neon Sign', note: 'Vibrant neon tube bloom', icon: '⚡' },
                  { id: 'hyper', title: 'Hyper Radiance', note: 'Intense glowing bloom effect', icon: '🌟' },
                ].map((item) => {
                  const isSelected = customization.glowIntensity === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => update({ glowIntensity: item.id as typeof customization.glowIntensity })}
                      style={{
                        padding: '14px',
                        borderRadius: '16px',
                        background: isSelected
                          ? 'rgba(37, 211, 102, 0.1)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected
                          ? '1.5px solid var(--green)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span>{item.icon}</span>
                        <span style={{ fontSize: '13px', fontWeight: '700' }}>{item.title}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.note}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Number Separator (Comma / Dot / Space) */}
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px', letterSpacing: '0.05em' }}>
                THOUSAND SEPARATOR STYLE
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[
                  { id: 'comma', label: 'Comma (12,450)' },
                  { id: 'dot', label: 'Dot (12.450)' },
                  { id: 'space', label: 'Space (12 450)' },
                  { id: 'none', label: 'None (12450)' },
                ].map((sep) => {
                  const isSelected = customization.separatorType === sep.id;
                  return (
                    <button
                      key={sep.id}
                      onClick={() => update({ separatorType: sep.id as typeof customization.separatorType })}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(37, 211, 102, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1px solid var(--green)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      {sep.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: TYPOGRAPHY & SIZE */}
          {activeTab === 'typography' && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px', letterSpacing: '0.05em' }}>
                DIGIT FONT FAMILY
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {[
                  { id: 'inter', name: 'Inter (Modern Sans)', sample: '1,234,567' },
                  { id: 'mono', name: 'JetBrains Mono (Digital LED)', sample: '1,234,567' },
                  { id: 'outfit', name: 'Outfit (Sleek Rounded)', sample: '1,234,567' },
                  { id: 'space', name: 'Space Grotesk (Tech Display)', sample: '1,234,567' },
                  { id: 'impact', name: 'Impact / Chunky (Bold)', sample: '1,234,567' },
                ].map((font) => {
                  const isSelected = customization.fontFamily === font.id;
                  return (
                    <button
                      key={font.id}
                      onClick={() => update({ fontFamily: font.id as typeof customization.fontFamily })}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: isSelected ? 'rgba(37, 211, 102, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1px solid var(--green)' : '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>
                        {font.name}
                      </span>
                      <span
                        style={{
                          fontSize: '18px',
                          fontWeight: '800',
                          fontFamily: getFontFamilyCSS(font.id as typeof customization.fontFamily),
                          color: isSelected ? 'var(--green)' : 'var(--text-secondary)',
                        }}
                      >
                        {font.sample}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Digit Scale */}
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px', letterSpacing: '0.05em' }}>
                DIGIT SIZE SCALE
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[
                  { id: 'compact', label: '85%', sub: 'Compact' },
                  { id: 'normal', label: '100%', sub: 'Default' },
                  { id: 'large', label: '115%', sub: 'Large' },
                  { id: 'mega', label: '130%', sub: 'Mega' },
                ].map((s) => {
                  const isSelected = customization.sizeScale === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => update({ sizeScale: s.id as typeof customization.sizeScale })}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        background: isSelected ? 'var(--green)' : 'rgba(255, 255, 255, 0.03)',
                        color: isSelected ? '#000000' : 'var(--text-primary)',
                        border: isSelected ? '1px solid var(--green)' : '1px solid rgba(255, 255, 255, 0.08)',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div>{s.label}</div>
                      <div style={{ fontSize: '10px', opacity: isSelected ? 0.8 : 0.5, fontWeight: '500' }}>
                        {s.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: DYNAMICS & ANIMATION */}
          {activeTab === 'animation' && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px', letterSpacing: '0.05em' }}>
                ODOMETER ROLLING SPEED
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                {[
                  { ms: 0, title: 'Instant Jump (0s)', note: 'Direct number update without roll' },
                  { ms: 600, title: 'Snappy Roll (0.6s)', note: 'Fast numerical flip' },
                  { ms: 1500, title: 'Smooth Standard (1.5s)', note: 'YouTube & SocialBlade standard' },
                  { ms: 2500, title: 'Cinematic Roll (2.5s)', note: 'Slow, graceful rolling animation' },
                ].map((anim) => {
                  const isSelected = customization.animDurationMs === anim.ms;
                  return (
                    <button
                      key={anim.ms}
                      onClick={() => update({ animDurationMs: anim.ms })}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px',
                        background: isSelected ? 'rgba(37, 211, 102, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1.5px solid var(--green)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '12.5px', fontWeight: '700' }}>{anim.title}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{anim.note}</p>
                    </button>
                  );
                })}
              </div>

              {/* Audio Sound Effect Toggle */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                    Tick Sound On Change 🔔
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Play a mechanical tick when the subscriber count increases or decreases
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {customization.soundEnabled && (
                    <button
                      onClick={() => playTickSound()}
                      title="Test tick sound"
                      style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: 'var(--text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Test
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const next = !customization.soundEnabled;
                      update({ soundEnabled: next });
                      if (next) playTickSound();
                    }}
                    style={{
                      width: '46px',
                      height: '26px',
                      borderRadius: '999px',
                      background: customization.soundEnabled ? 'var(--green)' : 'rgba(255, 255, 255, 0.15)',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: customization.soundEnabled ? '23px' : '3px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </button>
                </div>
              </div>

              {/* Delta Pill Toggle */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                    Change Delta Indicator (▲ +1 / ▼ -1)
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Display animated green/red delta badge when followers change
                  </p>
                </div>

                <button
                  onClick={() => update({ showDeltaIndicator: !customization.showDeltaIndicator })}
                  style={{
                    width: '46px',
                    height: '26px',
                    borderRadius: '999px',
                    background: customization.showDeltaIndicator ? 'var(--green)' : 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: customization.showDeltaIndicator ? '23px' : '3px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions: Reset to Default & Close */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          {/* Reset to Default Button */}
          <button
            id="reset-counter-customization-btn"
            onClick={handleResetClick}
            style={{
              padding: '9px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: resetNotice ? 'var(--green)' : 'var(--text-secondary)',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = resetNotice ? 'var(--green)' : 'var(--text-secondary)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>{resetNotice ? 'Defaults Restored ✓' : 'Reset to Default'}</span>
          </button>

          {/* Done / Apply Button */}
          <button
            id="apply-customization-btn"
            onClick={onClose}
            style={{
              padding: '9px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 16px var(--green-glow)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px var(--green-glow-strong)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px var(--green-glow)';
            }}
          >
            Done
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUpModal {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
