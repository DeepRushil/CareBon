import { describe, it, expect } from 'vitest';
import { renderBreakdownBars, renderTrend } from '../js/charts.js';

describe('renderBreakdownBars', () => {
  it('renders SVG markup with category bars', () => {
    const breakdown = {
      transport: 1200,
      home: 800,
      food: 1500,
      stuff: 600,
    };
    const html = renderBreakdownBars(breakdown);
    expect(html).toContain('<svg');
    expect(html).toContain('Travel');
    expect(html).toContain('Home energy');
    expect(html).toContain('Food');
    expect(html).toContain('Stuff');
    expect(html).toContain('1,200 kg');
    expect(html).toContain('800 kg');
    expect(html).toContain('1,500 kg');
    expect(html).toContain('600 kg');
  });

  it('handles missing or partial breakdown data gracefully', () => {
    const html = renderBreakdownBars({ food: 1000 });
    expect(html).toContain('Food');
    expect(html).toContain('1,000 kg');
    expect(html).toContain('0 kg'); // other categories default to 0 kg
  });
});

describe('renderTrend', () => {
  it('returns empty string if history contains fewer than 2 snapshots', () => {
    expect(renderTrend([])).toBe('');
    expect(renderTrend([{ total: 3000, date: '2026-06-20' }])).toBe('');
  });

  it('renders SVG trend chart when history has 2 or more snapshots', () => {
    const history = [
      { total: 5000, date: '2026-05-20T00:00:00Z' },
      { total: 3000, date: '2026-06-20T00:00:00Z' },
    ];
    const html = renderTrend(history);
    expect(html).toContain('<svg');
    expect(html).toContain('Your footprint over time');
    expect(html).toContain('2.3 t target');
    expect(html).toContain('May');
    expect(html).toContain('Jun');
  });
});
