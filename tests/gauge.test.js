import { describe, it, expect } from 'vitest';
import { renderGauge } from '../js/gauge.js';
import { BENCHMARK_TONNES } from '../js/factors.js';

describe('renderGauge', () => {
  it('renders benchmark comparison rows', () => {
    const html = renderGauge(3.5, true);
    expect(html).toContain('Climate-safe target');
    expect(html).toContain('India');
    expect(html).toContain('World average');
    expect(html).toContain('European Union');
    expect(html).toContain('United States');
  });

  it('adds a "You" row when showYou is true', () => {
    const html = renderGauge(3.5, true);
    expect(html).toContain('You');
  });

  it('does not add a "You" row when showYou is false', () => {
    const html = renderGauge(3.5, false);
    expect(html).not.toContain('You');
  });

  it('marks "You" as under if footprint is less than or equal to world average', () => {
    const html = renderGauge(BENCHMARK_TONNES.world - 0.5, true);
    expect(html).toContain('bm-you-under');
    expect(html).not.toContain('bm-you-over');
    expect(html).toContain('is-under');
  });

  it('marks "You" as over if footprint is greater than world average', () => {
    const html = renderGauge(BENCHMARK_TONNES.world + 0.5, true);
    expect(html).toContain('bm-you-over');
    expect(html).not.toContain('bm-you-under');
    expect(html).toContain('is-over');
  });

  it('handles negative or invalid values gracefully', () => {
    const html1 = renderGauge(-5, true);
    expect(html1).toContain('0.0 t');

    const html2 = renderGauge('invalid', true);
    expect(html2).toContain('0.0 t');
  });

  it('sorts the comparison rows in ascending order of values', () => {
    const html = renderGauge(1.0, true);
    // Since 1.0 is less than India's benchmark (1.9), "You" should appear before "India".
    // Let's verify the relative order of labels in the HTML.
    const safeIndex = html.indexOf('Climate-safe target');
    const youIndex = html.indexOf('You');
    const indiaIndex = html.indexOf('India');
    const worldIndex = html.indexOf('World average');
    const euIndex = html.indexOf('European Union');
    const usIndex = html.indexOf('United States');

    expect(youIndex).toBeGreaterThan(-1);
    expect(safeIndex).toBeGreaterThan(-1);
    
    // Sort order for 1.0 t: You (1.0) -> India (1.9) -> Climate-safe target (2.3) -> World (4.7) -> EU (6.8) -> US (14.3)
    // Wait, let's verify if youIndex is indeed before indiaIndex.
    expect(youIndex).toBeLessThan(indiaIndex);
    expect(indiaIndex).toBeLessThan(safeIndex);
    expect(safeIndex).toBeLessThan(worldIndex);
    expect(worldIndex).toBeLessThan(euIndex);
    expect(euIndex).toBeLessThan(usIndex);
  });
});
