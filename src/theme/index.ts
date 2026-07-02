// ---------------------------------------------------------------------------
// Design tokens — palette, espacements, typographie, formatage.
// ---------------------------------------------------------------------------
import { useColorScheme } from 'react-native';

export interface Palette {
  bg: string;
  bgElevated: string;
  card: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  positive: string;
  positiveSoft: string;
  negative: string;
  negativeSoft: string;
  warning: string;
  warningSoft: string;
  inputBg: string;
}

const light: Palette = {
  bg: '#F4F6FB',
  bgElevated: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E3E7EF',
  text: '#101524',
  textSecondary: '#475069',
  textMuted: '#8A92A6',
  accent: '#2563EB',
  accentSoft: '#E0EAFF',
  positive: '#0E9F6E',
  positiveSoft: '#D7F5E9',
  negative: '#E02424',
  negativeSoft: '#FCE4E4',
  warning: '#C2700A',
  warningSoft: '#FBEBD3',
  inputBg: '#F1F4FA',
};

const dark: Palette = {
  bg: '#0B0F19',
  bgElevated: '#151A26',
  card: '#171D2B',
  border: '#262E3F',
  text: '#F2F4F8',
  textSecondary: '#AEB6C8',
  textMuted: '#727C92',
  accent: '#5B8DEF',
  accentSoft: '#1E2A45',
  positive: '#34D399',
  positiveSoft: '#13301F',
  negative: '#F87171',
  negativeSoft: '#3A1B1B',
  warning: '#F1A33C',
  warningSoft: '#3A2A12',
  inputBg: '#10141F',
};

export function usePalette(): Palette {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

// ---------- Formatage ----------

const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});
const eur2 = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export function formatEUR(value: number, decimals = false): string {
  if (!isFinite(value)) return '—';
  return decimals ? eur2.format(value) : eur.format(value);
}

export function formatPct(value: number, decimals = 1): string {
  if (!isFinite(value)) return '—';
  return `${(value * 100).toFixed(decimals)} %`;
}

export function formatNumber(value: number): string {
  if (!isFinite(value)) return '—';
  return new Intl.NumberFormat('fr-FR').format(value);
}
