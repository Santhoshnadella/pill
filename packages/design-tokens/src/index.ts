/**
 * @pill/design-tokens
 * Typed design tokens mirroring the calm, minimal PILL visual philosophy
 */

export const colors = {
  bg: '#0B1012',
  surface: '#111A1D',
  surfaceRaised: '#172326',
  surfaceHover: '#1D2D31',
  border: '#26383B',
  borderFocus: '#3D5A5E',

  text: '#F1F7F7',
  textMuted: '#9AAEB0',
  textSubtle: '#61787A',

  primary: '#2DD4BF',
  primaryHover: '#5EEAD4',
  primaryGlow: 'rgba(45, 212, 191, 0.15)',
  cyan: '#67E8F9',

  danger: '#F87171',
  dangerSurface: 'rgba(248, 113, 113, 0.1)',
  warning: '#FBBF24',
  warningSurface: 'rgba(251, 191, 36, 0.1)',
  success: '#34D399',
} as const;

export const radii = {
  sm: '8px',
  md: '12px',
  lg: '18px',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.4)',
  md: '0 4px 12px rgba(0, 0, 0, 0.5)',
  glow: '0 0 20px rgba(45, 212, 191, 0.2)',
} as const;

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

export type PillColors = typeof colors;
export type PillRadii = typeof radii;
