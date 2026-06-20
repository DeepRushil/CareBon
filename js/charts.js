/**
 * charts.js — Hand-rolled SVG for the category breakdown and the trend line.
 * No charting library: smaller, faster, and nothing third-party to trust.
 */

import { formatKg, formatDate } from './format.js';

const CATEGORY_META = {
  transport: { label: 'Travel', color: 'var(--cat-transport)' },
  home: { label: 'Home energy', color: 'var(--cat-home)' },
  food: { label: 'Food', color: 'var(--cat-food)' },
  stuff: { label: 'Stuff', color: 'var(--cat-stuff)' },
};

/** Horizontal bars for the four categories. Accessible text accompanies it. */
export function renderBreakdownBars(breakdown) {
  const keys = ['transport', 'home', 'food', 'stuff'];
  const max = Math.max(1, ...keys.map((k) => breakdown[k] || 0));
  const rowH = 46;
  const width = 520;
  const barX = 132;
  const barMax = width - barX - 96;

  const rows = keys.map((k, i) => {
    const v = breakdown[k] || 0;
    const w = Math.max(2, (v / max) * barMax);
    const y = i * rowH + 14;
    const { label, color } = CATEGORY_META[k];
    return `
      <text x="0" y="${y + 18}" class="chart-label">${label}</text>
      <rect x="${barX}" y="${y + 4}" width="${barMax}" height="22" rx="6" fill="var(--track)"/>
      <rect x="${barX}" y="${y + 4}" width="${w.toFixed(1)}" height="22" rx="6" fill="${color}" class="bar-fill"/>
      <text x="${barX + barMax + 12}" y="${y + 20}" class="chart-value">${formatKg(v)}</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${width} ${keys.length * rowH + 12}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Footprint by category">${rows}</svg>`;
}

/** Line chart of saved snapshots over time. */
export function renderTrend(history) {
  const pts = history.map((h) => h.total / 1000); // tonnes
  if (pts.length < 2) return '';
  const width = 520;
  const height = 200;
  const pad = 32;
  const max = Math.max(...pts, 2.3) * 1.1;
  const min = 0;
  const stepX = (width - pad * 2) / (pts.length - 1);
  const scaleY = (v) => height - pad - ((v - min) / (max - min)) * (height - pad * 2);

  const coords = pts.map((v, i) => ({ x: pad + i * stepX, y: scaleY(v) }));
  const line = coords.map((c, i) => `${i ? 'L' : 'M'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const area = `${line} L ${coords[coords.length - 1].x.toFixed(1)} ${height - pad} L ${coords[0].x.toFixed(1)} ${height - pad} Z`;
  const targetY = scaleY(2.3);

  const dots = coords.map((c) => `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="4" fill="var(--under)"/>`).join('');
  const first = formatDate(history[0].date);
  const last = formatDate(history[history.length - 1].date);

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Your footprint over time">
    <line x1="${pad}" y1="${targetY.toFixed(1)}" x2="${width - pad}" y2="${targetY.toFixed(1)}" stroke="var(--ink)" stroke-dasharray="4 4" stroke-width="1" opacity="0.5"/>
    <text x="${width - pad}" y="${(targetY - 6).toFixed(1)}" text-anchor="end" class="chart-mini">2.3 t target</text>
    <path d="${area}" fill="var(--under-soft)" opacity="0.5"/>
    <path d="${line}" fill="none" stroke="var(--under)" stroke-width="2.5" stroke-linejoin="round"/>
    ${dots}
    <text x="${pad}" y="${height - 8}" class="chart-mini">${first}</text>
    <text x="${width - pad}" y="${height - 8}" text-anchor="end" class="chart-mini">${last}</text>
  </svg>`;
}

export { CATEGORY_META };
