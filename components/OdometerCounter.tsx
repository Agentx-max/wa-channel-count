'use client';

import React, { useEffect, useState, useRef } from 'react';

interface OdometerCounterProps {
  value: number;
  fontSize?: string;
  duration?: number; // Animation duration in ms
  digitColor?: string;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function DigitColumn({ digit, digitColor }: { digit: number; digitColor?: string }) {
  return (
    <span
      className="digit-col"
      style={{
        display: 'inline-block',
        height: '1em',
        lineHeight: '1em',
        overflow: 'hidden',
        position: 'relative',
        verticalAlign: 'top',
        width: '0.62em',
        textAlign: 'center',
        background: 'transparent',
        backgroundColor: 'transparent',
      }}
    >
      <span
        className="digit-span"
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(-${digit * 10}%)`,
          transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
          willChange: 'transform',
          background: 'transparent',
          backgroundColor: 'transparent',
        }}
      >
        {DIGITS.map((d) => (
          <span
            key={d}
            style={{
              height: '1em',
              lineHeight: '1em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: digitColor || 'var(--text-primary)',
              background: 'transparent',
              backgroundColor: 'transparent',
            }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

export default function OdometerCounter({
  value,
  fontSize = '72px',
  duration = 1500,
  digitColor = '#ffffff',
}: OdometerCounterProps) {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const animRef = useRef<number | null>(null);
  const startValRef = useRef<number>(value);
  const startTimeRef = useRef<number | null>(null);

  // Smooth numerical interpolation (YouTube / SocialBlade style)
  useEffect(() => {
    if (value === displayValue) return;

    const startVal = displayValue;
    const targetVal = value;
    startValRef.current = startVal;
    startTimeRef.current = null;

    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentVal = Math.round(
        startVal + (targetVal - startVal) * easedProgress,
      );
      setDisplayValue(currentVal);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetVal);
      }
    };

    animRef.current = requestAnimationFrame(step);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const formatted = displayValue.toLocaleString('en-US');
  const chars = formatted.split('');

  // Dynamically scale font size based on digit count to prevent container overflow
  const computedFontSize = fontSize
    ? fontSize
    : chars.length > 9
      ? 'clamp(24px, 5vw, 42px)'
      : chars.length > 6
        ? 'clamp(32px, 6.5vw, 56px)'
        : 'clamp(44px, 8.5vw, 76px)';

  const dropShadowFilter =
    digitColor && digitColor !== '#ffffff'
      ? `drop-shadow(0 0 16px ${digitColor}80)`
      : 'drop-shadow(0 0 16px rgba(37, 211, 102, 0.35))';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: computedFontSize,
        fontWeight: '800',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        letterSpacing: '-0.03em',
        lineHeight: 1,
        color: digitColor || 'var(--text-primary)',
        userSelect: 'none',
        textShadow: 'none',
        filter: dropShadowFilter,
        maxWidth: '100%',
        overflow: 'hidden',
        transition: 'color 0.25s ease, filter 0.25s ease',
      }}
    >
      {chars.map((char, index) => {
        if (char === ',') {
          return (
            <span
              key={`comma-${chars.length - index}`}
              style={{
                display: 'inline-block',
                margin: '0 2px',
                color: digitColor || 'var(--green)',
                opacity: 0.85,
                transition: 'color 0.25s ease',
              }}
            >
              ,
            </span>
          );
        }

        const digit = parseInt(char, 10);
        return (
          <DigitColumn
            key={`digit-${chars.length - index}`}
            digit={digit}
            digitColor={digitColor}
          />
        );
      })}
    </div>
  );
}
