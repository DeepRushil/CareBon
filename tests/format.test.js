import { describe, it, expect } from 'vitest';
import { formatKg, formatTonnes, formatDate } from '../js/format.js';

describe('formatKg', () => {
  it('formats positive integers with kg suffix', () => {
    expect(formatKg(1234)).toBe('1,234 kg');
    expect(formatKg(0)).toBe('0 kg');
  });

  it('rounds decimal inputs', () => {
    expect(formatKg(1234.6)).toBe('1,235 kg');
    expect(formatKg(1234.4)).toBe('1,234 kg');
  });

  it('coerces invalid or negative inputs to 0', () => {
    expect(formatKg(-50)).toBe('0 kg');
    expect(formatKg('abc')).toBe('0 kg');
    expect(formatKg(null)).toBe('0 kg');
    expect(formatKg(undefined)).toBe('0 kg');
  });
});

describe('formatTonnes', () => {
  it('formats to two decimal places', () => {
    expect(formatTonnes(2.3)).toBe('2.30');
    expect(formatTonnes(0)).toBe('0.00');
    expect(formatTonnes(4.567)).toBe('4.57');
  });

  it('coerces invalid or negative inputs to 0.00', () => {
    expect(formatTonnes(-1.5)).toBe('0.00');
    expect(formatTonnes('not-a-number')).toBe('0.00');
    expect(formatTonnes(null)).toBe('0.00');
    expect(formatTonnes(undefined)).toBe('0.00');
  });
});

describe('formatDate', () => {
  it('formats valid ISO dates correctly', () => {
    const formatted = formatDate('2026-06-20T22:29:37Z');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Jun');
  });

  it('returns empty string for invalid dates', () => {
    expect(formatDate('invalid-date')).toBe('');
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });
});
