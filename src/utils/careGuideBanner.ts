export const DEFAULT_CARE_GUIDE_BANNER_TEXT =
  'Clique aqui para saber a melhor maneira de aproveitar seu lanche.';

export const DEFAULT_CARE_GUIDE_BANNER_COLOR = '#15803D';

export interface BannerColorPreset {
  id: string;
  label: string;
  hex: string;
  containerClass: string;
  isDark: boolean;
}

export const BANNER_COLOR_PRESETS: BannerColorPreset[] = [
  {
    id: 'green-vivid',
    label: 'Verde Destacado',
    hex: '#15803D',
    containerClass:
      'bg-gradient-to-r from-green-700 via-emerald-700 to-green-600 hover:from-green-800 hover:via-emerald-800 hover:to-green-700 border-green-800/40 shadow-md shadow-green-900/15',
    isDark: true,
  },
  {
    id: 'mana-green',
    label: 'Verde Maná',
    hex: '#2D5A27',
    containerClass:
      'bg-gradient-to-r from-[#2D5A27] via-[#254d20] to-[#34692d] hover:from-[#23471f] hover:to-[#2D5A27] border-[#1c3a19]/40 shadow-md shadow-[#2D5A27]/20',
    isDark: true,
  },
  {
    id: 'emerald-deep',
    label: 'Verde Esmeralda',
    hex: '#047857',
    containerClass:
      'bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-600 hover:from-emerald-800 hover:to-teal-700 border-emerald-900/30 shadow-md shadow-emerald-900/15',
    isDark: true,
  },
  {
    id: 'green-soft',
    label: 'Verde Suave',
    hex: '#ECFDF5',
    containerClass:
      'bg-gradient-to-r from-emerald-50 via-white to-green-50 hover:from-emerald-100 hover:to-green-100 border-emerald-300 shadow-sm',
    isDark: false,
  },
  {
    id: 'mana-gold',
    label: 'Dourado Maná',
    hex: '#9A6D30',
    containerClass:
      'bg-gradient-to-r from-[#9A6D30] via-[#875e27] to-[#b07e3a] hover:from-[#875e27] hover:to-[#9A6D30] border-[#6e4c1d]/30 shadow-md shadow-amber-900/15',
    isDark: true,
  },
  {
    id: 'cream-classic',
    label: 'Creme Clássico',
    hex: '#FAF7F0',
    containerClass:
      'bg-gradient-to-r from-[#FAF7F0] via-white to-amber-50/80 hover:from-amber-50 hover:to-amber-100/70 border-mana-gold/30 shadow-sm',
    isDark: false,
  },
];

/**
 * Determina se uma cor hexadecimal é escura (para usar texto branco) ou clara (texto escuro).
 */
export function isHexColorDark(hexColor?: string): boolean {
  if (!hexColor || typeof hexColor !== 'string') return true;
  const normalized = hexColor.trim().replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(normalized) && !/^[0-9A-Fa-f]{3}$/.test(normalized)) {
    return true;
  }
  const fullHex =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;

  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  // Luminância relativa percebida (YIQ)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 155;
}

export function resolveBannerStyle(bannerColor?: string): {
  preset: BannerColorPreset | null;
  hex: string;
  isDark: boolean;
} {
  const targetHex = (bannerColor || DEFAULT_CARE_GUIDE_BANNER_COLOR).trim().toUpperCase();
  const preset =
    BANNER_COLOR_PRESETS.find((p) => p.hex.toUpperCase() === targetHex) || null;
  const isDark = preset ? preset.isDark : isHexColorDark(targetHex);
  return {
    preset,
    hex: targetHex,
    isDark,
  };
}
