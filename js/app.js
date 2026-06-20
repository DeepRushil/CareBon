/**
 * app.js — UI controller. Reads the form, runs the pure calculators, and
 * paints the gauge, breakdown, comparison, insights and trend. Holds no
 * business logic of its own; all numbers come from the tested modules.
 */

import { calcBreakdown, toTonnes } from './calculator.js';
import { generateInsights } from './insights.js';
import { loadHistory, saveSnapshot, clearHistory } from './storage.js';
import { renderGauge } from './gauge.js';
import { renderBreakdownBars, renderTrend } from './charts.js';
import { formatKg, formatTonnes, formatDate } from './format.js';
import { BENCHMARK_TONNES } from './factors.js';

const $ = (sel) => document.querySelector(sel);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const els = {
  form: $('#footprint-form'),
  gauge: $('#gauge'),
  readout: $('#readout-value'),
  verdict: $('#verdict'),
  breakdown: $('#breakdown'),
  comparison: $('#comparison'),
  insights: $('#insights-list'),
  trend: $('#trend'),
  trackEmpty: $('#track-empty'),
  saveBtn: $('#save-btn'),
  clearBtn: $('#clear-btn'),
};

let current = { total: 0, breakdown: {} };
let hasInteracted = false;

/** Read the whole form into the shape the calculator expects. */
function readForm() {
  const f = els.form;
  const num = (name) => f.elements[name]?.value ?? '';
  return {
    transport: {
      carFuel: num('carFuel'),
      carKmWeek: num('carKmWeek'),
      busKmWeek: num('busKmWeek'),
      trainKmWeek: num('trainKmWeek'),
      shortFlights: num('shortFlights'),
      longFlights: num('longFlights'),
    },
    home: {
      region: num('region'),
      electricityKwhMonth: num('electricityKwhMonth'),
      gasKwhMonth: num('gasKwhMonth'),
      household: num('household'),
    },
    food: { diet: num('diet') },
    stuff: { level: num('stuff') },
  };
}

/** Animate a number from a→b unless reduced motion is requested. */
function countTo(el, from, to) {
  if (reduceMotion || from === to) {
    el.textContent = formatTonnes(to);
    return;
  }
  const start = performance.now();
  const dur = 600;
  function frame(now) {
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = formatTonnes(from + (to - from) * eased);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function renderComparison(youTonnes) {
  const rows = [
    { label: 'You', value: youTonnes, you: true },
    { label: 'Climate-safe target', value: BENCHMARK_TONNES.target_2030 },
    { label: 'World average', value: BENCHMARK_TONNES.world },
    { label: 'India average', value: BENCHMARK_TONNES.india },
  ];
  const max = Math.max(...rows.map((r) => r.value), 1);
  els.comparison.innerHTML = rows.map((r) => {
    const w = (r.value / max) * 100;
    return `<div class="cmp-row${r.you ? ' cmp-you' : ''}">
      <span class="cmp-label">${r.label}</span>
      <span class="cmp-bar" aria-hidden="true"><span class="cmp-fill" style="width:${w.toFixed(0)}%"></span></span>
      <span class="cmp-num">${formatTonnes(r.value)} t</span>
    </div>`;
  }).join('');
}

function renderInsights(inputs, breakdown) {
  const actions = generateInsights(inputs, breakdown);
  if (!actions.length) {
    els.insights.innerHTML = '<p class="muted">Add some travel, home or food details above and your biggest opportunities to cut emissions will appear here, ranked by impact.</p>';
    return;
  }
  els.insights.innerHTML = actions.map((a, i) => `
    <li class="insight">
      <span class="insight-rank" aria-hidden="true">${i + 1}</span>
      <div class="insight-body">
        <h3 class="insight-title">${a.title}</h3>
        <p class="insight-detail">${a.detail}</p>
      </div>
      <span class="insight-saving"><span class="insight-saving-num">−${formatKg(a.saving)}</span><span class="insight-saving-unit">CO₂e / year</span></span>
    </li>`).join('');
}

function update() {
  const householdInput = els.form.elements['household'];
  if (householdInput && householdInput.value !== '') {
    const val = Number(householdInput.value);
    if (Number.isFinite(val) && val < 1) {
      householdInput.value = 1;
    }
  }

  const inputs = readForm();
  const breakdown = calcBreakdown(inputs);
  const tonnes = toTonnes(breakdown.total);
  const prev = toTonnes(current.total);
  current = { total: breakdown.total, breakdown };

  els.gauge.innerHTML = renderGauge(tonnes, hasInteracted);
  countTo(els.readout, prev, tonnes);

  const ratio = tonnes / BENCHMARK_TONNES.target_2030;
  const over = tonnes > BENCHMARK_TONNES.world;
  els.verdict.textContent = breakdown.total === 0
    ? 'Fill in the calculator to see your estimate.'
    : tonnes <= BENCHMARK_TONNES.target_2030
      ? 'Outstanding! You are below the climate-safe target and well under the world average.'
      : tonnes <= BENCHMARK_TONNES.world
        ? 'Good progress! You are under the world average - try to get closer to the climate-safe target.'
        : ratio > 10
          ? 'More than 10x the climate-safe target - look for big ways to get below the world average.'
          : `About ${formatTonnes(ratio)}x the climate-safe target - look for ways to get below the world average.`;
  els.verdict.classList.toggle('is-over', over && breakdown.total > 0);

  els.breakdown.innerHTML = renderBreakdownBars(breakdown);
  renderComparison(tonnes);
  renderInsights(inputs, breakdown);
  els.saveBtn.disabled = breakdown.total === 0;
}

function renderHistory(history) {
  if (history.length < 2) {
    els.trend.innerHTML = '';
    els.trackEmpty.hidden = false;
    els.trackEmpty.textContent = history.length === 1
      ? `Saved 1 snapshot (${formatDate(history[0].date)}). Save again next month to see your trend.`
      : 'Save your first snapshot to start tracking how your footprint changes over time.';
    els.clearBtn.hidden = history.length === 0;
    return;
  }
  els.trackEmpty.hidden = true;
  els.clearBtn.hidden = false;
  els.trend.innerHTML = renderTrend(history);
}

function unlockResults(shouldScroll = true) {
  const lockedSections = document.querySelectorAll('.section-locked');
  lockedSections.forEach((s) => s.classList.remove('section-locked'));

  const lockedNavs = document.querySelectorAll('.nav-locked');
  lockedNavs.forEach((n) => {
    n.classList.remove('nav-locked');
    n.removeAttribute('aria-disabled');
    n.removeAttribute('tabindex');
  });

  if (shouldScroll) {
    const target = $('#results');
    if (target) {
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      target.focus({ preventScroll: true });
    }
  }
}

function activatePersonalReadout() {
  if (!hasInteracted) {
    hasInteracted = true;
    current = { total: 0, breakdown: {} };
    els.readout.textContent = '0.00';
    const welcomeActions = $('#gauge-welcome-actions');
    const personalReadout = $('#gauge-personal-readout');
    if (welcomeActions) welcomeActions.classList.add('gauge-hidden');
    if (personalReadout) personalReadout.classList.remove('gauge-hidden');
  }
}

function init() {
  els.form.addEventListener('input', () => {
    if (!hasInteracted && els.form.contains(document.activeElement)) {
      activatePersonalReadout();
    }
    update();
  });

  const confirmBtn = $('#confirm-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      activatePersonalReadout();
      update();
      unlockResults(true);
    });
  }

  els.form.addEventListener('submit', (e) => e.preventDefault());

  els.saveBtn.addEventListener('click', () => {
    if (current.total === 0) return;
    const history = saveSnapshot(current);
    renderHistory(history);
    els.saveBtn.textContent = 'Saved ✓';
    setTimeout(() => { els.saveBtn.textContent = 'Save this month'; }, 1600);
  });

  els.clearBtn.addEventListener('click', () => {
    renderHistory(clearHistory());
  });

  // Smooth in-page navigation that still respects reduced motion.
  document.querySelectorAll('a[data-scroll]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      target.focus({ preventScroll: true });
    });
  });

  update();
  const history = loadHistory();
  renderHistory(history);
  if (history.length > 0) {
    activatePersonalReadout();
    update();
    unlockResults(false);
  }
}

document.addEventListener('DOMContentLoaded', init);
export { readForm, renderComparison }; // exported for potential testing
