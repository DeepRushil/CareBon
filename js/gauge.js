/**
 * gauge.js - The personal footprint visualization.
 *
 * Renders horizontal comparison bars showing the user's footprint against
 * key benchmarks (climate-safe target, India, world, US). Returns an HTML
 * string. The live numeric value is rendered separately in accessible HTML,
 * so this visualization provides context, not the primary reading.
 */

import { BENCHMARK_TONNES } from './factors.js';

/**
 * @param {number} tonnes the footprint to display, in tonnes CO2e/year
 * @returns {string} HTML markup for comparison bars
 */
export function renderGauge(tonnes, showYou = true) {
  const value = Math.max(0, Number(tonnes) || 0);
  const over = value > BENCHMARK_TONNES.world;

  const entries = [
    { label: 'Climate-safe target', val: BENCHMARK_TONNES.target_2030, cls: 'bm-safe' },
    { label: 'India', val: BENCHMARK_TONNES.india, cls: 'bm-india' },
    { label: 'World average', val: BENCHMARK_TONNES.world, cls: 'bm-world' },
    { label: 'European Union', val: BENCHMARK_TONNES.eu, cls: 'bm-eu' },
    { label: 'United States', val: BENCHMARK_TONNES.us, cls: 'bm-us' },
  ];

  if (showYou) {
    entries.push({ label: 'You', val: value, cls: over ? 'bm-you-over' : 'bm-you-under', you: true });
  }

  // Sort entries from lowest to highest so user falls in the right comparison slot
  entries.sort((a, b) => a.val - b.val);
  const max = Math.max(value, BENCHMARK_TONNES.us, 1);

  return entries.map((e, i) => {
    const w = Math.min(100, (e.val / max) * 100).toFixed(1);
    const rowCls = e.you ? ` bm-row-you ${over ? 'is-over' : 'is-under'}` : '';
    return `<div class="bm-row${rowCls}" style="--i:${i}">
      <span class="bm-label">${e.label}</span>
      <span class="bm-bar"><span class="bm-fill ${e.cls}" style="width:${w}%"></span></span>
      <span class="bm-val">${e.val.toFixed(1)} t</span>
    </div>`;
  }).join('');
}
