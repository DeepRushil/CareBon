/**
 * format.js — Small display helpers shared across the UI.
 */

const KG = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });
const T = new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatKg(kg) {
  return `${KG.format(Math.max(0, Math.round(Number(kg) || 0)))} kg`;
}

export function formatTonnes(t) {
  return `${T.format(Math.max(0, Number(t) || 0))}`;
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' });
}
