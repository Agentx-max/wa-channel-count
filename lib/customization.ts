export interface ColorPalette {
  id: string;
  name: string;
  digitColor: string;
  glowColor: string;
  isGradient?: boolean;
  preview: string;
}

export interface CounterCustomization {
  // Digit Color Settings (ONLY for digits, not container background)
  colorPaletteId: string;
  digitColor: string;
  glowColor: string;
  glowIntensity: 'none' | 'subtle' | 'neon' | 'hyper';
  customColorHex: string;
  isGradient: boolean;

  // Typography & Sizing
  fontFamily: 'inter' | 'mono' | 'outfit' | 'space' | 'impact';
  sizeScale: 'compact' | 'normal' | 'large' | 'mega';

  // Separator (comma / dot / space / none)
  separatorType: 'comma' | 'dot' | 'space' | 'none';
  separatorColor: string; // custom or matches theme

  // Refresh Rate & Timestamps
  pollIntervalMs: number;
  autoRefreshEnabled: boolean;
  timestampFormat: 'relative' | 'exact' | 'both' | 'hidden';

  // Animation & Feedback
  animDurationMs: number;
  soundEnabled: boolean;
  showDeltaIndicator: boolean;
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'whatsapp',
    name: 'Classic White & Green Glow',
    digitColor: '#ffffff',
    glowColor: '#25D366',
    preview: '#25D366',
  },
  {
    id: 'neon-green',
    name: 'WhatsApp Pure Neon',
    digitColor: '#25D366',
    glowColor: '#25D366',
    preview: '#25D366',
  },
  {
    id: 'cyan',
    name: 'Cyber Cyan',
    digitColor: '#00f2fe',
    glowColor: '#00f2fe',
    preview: '#00f2fe',
  },
  {
    id: 'pink',
    name: 'Synthwave Pink',
    digitColor: '#ff2a85',
    glowColor: '#ff007f',
    preview: '#ff2a85',
  },
  {
    id: 'gold',
    name: 'Sunset Amber Gold',
    digitColor: '#fbbf24',
    glowColor: '#f59e0b',
    preview: '#fbbf24',
  },
  {
    id: 'purple',
    name: 'Royal Amethyst',
    digitColor: '#c084fc',
    glowColor: '#a855f7',
    preview: '#c084fc',
  },
  {
    id: 'crimson',
    name: 'Volcanic Flame',
    digitColor: '#ff4d4d',
    glowColor: '#ef4444',
    preview: '#ff4d4d',
  },
  {
    id: 'glacier',
    name: 'Glacier Ice Blue',
    digitColor: '#38bdf8',
    glowColor: '#0284c7',
    preview: '#38bdf8',
  },
  {
    id: 'crisp-white',
    name: 'Platinum Crisp White',
    digitColor: '#ffffff',
    glowColor: 'rgba(255,255,255,0.7)',
    preview: '#ffffff',
  },
  {
    id: 'grad-aurora',
    name: 'Aurora Emerald-Cyan',
    digitColor: 'linear-gradient(135deg, #25D366 0%, #00f2fe 100%)',
    glowColor: '#25D366',
    isGradient: true,
    preview: 'linear-gradient(135deg, #25D366 0%, #00f2fe 100%)',
  },
  {
    id: 'grad-sunset',
    name: 'Solar Flare Sunset',
    digitColor: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
    glowColor: '#ff7e5f',
    isGradient: true,
    preview: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
  },
  {
    id: 'grad-cosmic',
    name: 'Cosmic Violet Neon',
    digitColor: 'linear-gradient(135deg, #c084fc 0%, #f43f5e 100%)',
    glowColor: '#c084fc',
    isGradient: true,
    preview: 'linear-gradient(135deg, #c084fc 0%, #f43f5e 100%)',
  },
];

export const DEFAULT_CUSTOMIZATION: CounterCustomization = {
  colorPaletteId: 'whatsapp',
  digitColor: '#ffffff',
  glowColor: '#25D366',
  glowIntensity: 'subtle',
  customColorHex: '#25D366',
  isGradient: false,
  fontFamily: 'inter',
  sizeScale: 'normal',
  separatorType: 'comma',
  separatorColor: 'var(--green)',
  pollIntervalMs: 5000,
  autoRefreshEnabled: true,
  timestampFormat: 'relative',
  animDurationMs: 1500,
  soundEnabled: false,
  showDeltaIndicator: true,
};

const STORAGE_KEY = 'wa_live_counter_customizations_v1';

export function loadSavedCustomization(): CounterCustomization {
  if (typeof window === 'undefined') return DEFAULT_CUSTOMIZATION;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOMIZATION;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CUSTOMIZATION, ...parsed };
  } catch {
    return DEFAULT_CUSTOMIZATION;
  }
}

export function saveCustomizationToStorage(customization: CounterCustomization): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customization));
  } catch {
    // localStorage might be unavailable/full
  }
}

export function getFontFamilyCSS(fontFamily: CounterCustomization['fontFamily']): string {
  switch (fontFamily) {
    case 'mono':
      return "'JetBrains Mono', 'Courier New', 'Consolas', monospace";
    case 'outfit':
      return "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
    case 'space':
      return "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif";
    case 'impact':
      return "'Impact', 'Arial Black', sans-serif";
    case 'inter':
    default:
      return "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  }
}

export function getTextShadowCSS(
  glowIntensity: CounterCustomization['glowIntensity'],
  glowColor: string
): string {
  switch (glowIntensity) {
    case 'none':
      return 'none';
    case 'neon':
      return `0 0 10px ${glowColor}, 0 0 25px ${glowColor}, 0 0 45px ${glowColor}`;
    case 'hyper':
      return `0 0 8px #ffffff, 0 0 18px ${glowColor}, 0 0 35px ${glowColor}, 0 0 65px ${glowColor}`;
    case 'subtle':
    default:
      return `0 0 24px ${glowColor}40, 0 0 8px ${glowColor}60`;
  }
}

export function playTickSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch {
    // AudioContext might be blocked before user gesture
  }
}
