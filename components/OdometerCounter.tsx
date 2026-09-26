'use client';

import React, { useEffect, useState, useRef } from 'react';
import { getTextShadowCSS } from '@/lib/customization';

interface OdometerCounterProps {
  value: number;
  fontSize?: string;
  duration?: number; // Animation duration in ms
  digitColor?: string;
  glowColor?: string;
  glowIntensity?: 'none' | 'subtle' | 'neon' | 'hyper';
  isGradient?: boolean;
  fontFamily?: string;
  sizeMultiplier?: number;
  separatorType?: 'comma' | 'dot' | 'space' | 'none';
  separatorColor?: string;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface DigitColumnProps {
  digit: number;
  digitColor: string;
  glowColor: string;
  glowIntensity: 'none' | 'subtle' | 'neon' | 'hyper';
  isGradient: boolean;
}

function DigitColumn({
  digit,
  digitColor,
  glowColor,
  glowIntensity,
  isGradient,
}: DigitColumnProps) {
  const isGrad = isGradient || digitColor.startsWith('linear-gradient');

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
              background: 'transparent',
              backgroundColor: 'transparent',
              ...(isGrad
                ? {
                    backgroundImage: digitColor,
                    WebkitBackgroundImage: digitColor,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent',
                  }
                : {
                    color: digitColor,
                    textShadow: getTextShadowCSS(glowIntensity, glowColor),
                  }),
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
  glowColor = '#25D366',
  glowIntensity = 'subtle',
  isGradient = false,
  fontFamily = "'Inter', system-ui, -apple-system, sans-serif",
  sizeMultiplier = 1,
  separatorType = 'comma',
  separatorColor = 'var(--green)',
}: OdometerCounterProps) {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const animRef = useRef<number | null>(null);
  const startValRef = useRef<number>(value);
  const startTimeRef = useRef<number | null>(null);

  // Smooth numerical interpolation (YouTube / SocialBlade style)
  useEffect(() => {
    if (value === displayValue) return;

    if (duration <= 0) {
      setDisplayValue(value);
      return;
    }

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
  const rawFontSize = fontSize
    ? fontSize
    : chars.length > 9
      ? 'clamp(24px, 5vw, 42px)'
      : chars.length > 6
        ? 'clamp(32px, 6.5vw, 56px)'
        : 'clamp(44px, 8.5vw, 76px)';

  const computedFontSize = sizeMultiplier === 1
    ? rawFontSize
    : `calc(${rawFontSize} * ${sizeMultiplier})`;

  const isGrad = isGradient || digitColor.startsWith('linear-gradient');

  // Compute filter for gradient glows
  const filterGlow = isGrad && glowIntensity !== 'none'
    ? glowIntensity === 'hyper'
      ? `drop-shadow(0 0 12px ${glowColor}) drop-shadow(0 0 24px ${glowColor})`
      : glowIntensity === 'neon'
        ? `drop-shadow(0 0 8px ${glowColor})`
        : `drop-shadow(0 0 5px ${glowColor}70)`
    : undefined;

  const separatorChar =
    separatorType === 'dot'
      ? '.'
      : separatorType === 'space'
        ? ' '
        : separatorType === 'none'
          ? ''
          : ',';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: computedFontSize,
        fontWeight: '800',
        fontFamily,
        letterSpacing: '-0.03em',
        lineHeight: 1,
        userSelect: 'none',
        maxWidth: '100%',
        overflow: 'hidden',
        filter: filterGlow,
        transition: 'font-size 0.25s ease, filter 0.25s ease',
      }}
    >
      {chars.map((char, index) => {
        if (char === ',') {
          if (separatorType === 'none') {
            return null;
          }
          return (
            <span
              key={`sep-${chars.length - index}`}
              style={{
                display: 'inline-block',
                margin: separatorType === 'space' ? '0 5px' : '0 2px',
                color: separatorColor || 'var(--green)',
                opacity: 0.85,
                fontWeight: '700',
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              {separatorChar}
            </span>
          );
        }

        const digit = parseInt(char, 10);
        return (
          <DigitColumn
            key={`digit-${chars.length - index}`}
            digit={digit}
            digitColor={digitColor}
            glowColor={glowColor}
            glowIntensity={glowIntensity}
            isGradient={isGrad}
          />
        );
      })}
    </div>
  );
}
