import { describe, it, expect } from 'vitest';
import { colors, radii } from './index.js';

describe('Design Tokens', () => {
  it('should define core dark theme tokens', () => {
    expect(colors.bg).toBe('#0B1012');
    expect(colors.primary).toBe('#2DD4BF');
    expect(colors.text).toBe('#F1F7F7');
  });

  it('should define standard radius scale', () => {
    expect(radii.sm).toBe('8px');
    expect(radii.md).toBe('12px');
    expect(radii.lg).toBe('18px');
  });
});
