/**
 * insights.js — Turn a footprint into ranked, personal actions.
 *
 * Each candidate action estimates the kilograms a person could save *given
 * their own inputs*, so the list reorders for a frequent flyer versus a heavy
 * commuter. Pure and testable: same inputs, same ordered output.
 */

import {
  TRANSPORT_PER_KM, FLIGHT, GRID_INTENSITY, DIET_ANNUAL, DIET_LADDER,
  DIET_LABEL, STUFF_ANNUAL,
} from './factors.js';
import { clampNumber } from './calculator.js';

const WEEKS = 52;
const MONTHS = 12;
const MIN_SAVING = 50; // ignore actions that barely move the needle

/**
 * @param {object} inputs the raw form inputs
 * @param {object} breakdown the computed {transport, home, food, stuff, total}
 * @returns {Array<{title,detail,saving,category}>} sorted high → low impact
 */
export function generateInsights(inputs = {}, breakdown = {}) {
  const t = inputs.transport ?? {};
  const h = inputs.home ?? {};
  const out = [];

  // --- Flights: usually the single largest lever for those who fly. ---
  if (clampNumber(t.longFlights) >= 1) {
    out.push({
      category: 'transport',
      title: 'Swap one long-haul return for a closer trip',
      detail: 'A single intercontinental return flight outweighs months of everyday choices. Keeping one trip regional this year is the biggest single saving available to you.',
      saving: FLIGHT.long_haul,
    });
  }
  if (clampNumber(t.shortFlights) >= 1) {
    out.push({
      category: 'transport',
      title: 'Take the train instead of one short flight',
      detail: 'On regional routes, rail typically emits a fraction of flying for a similar journey time once airports are counted.',
      saving: FLIGHT.short_haul,
    });
  }

  // --- Car: shift trips, or move to a cleaner drivetrain. ---
  const carFactor = TRANSPORT_PER_KM[t.carFuel] ?? TRANSPORT_PER_KM.petrol;
  const carKgYr = clampNumber(t.carKmWeek) * WEEKS * carFactor;
  if (carKgYr > 0) {
    out.push({
      category: 'transport',
      title: 'Move a fifth of car trips to walking, cycling or transit',
      detail: 'Short local drives are the easiest to replace. Shifting roughly 20% of your driving keeps the car for when it genuinely saves time.',
      saving: carKgYr * 0.2,
    });
    if (t.carFuel === 'petrol' || t.carFuel === 'diesel') {
      const evKgYr = clampNumber(t.carKmWeek) * WEEKS * TRANSPORT_PER_KM.electric;
      out.push({
        category: 'transport',
        title: 'Make your next car electric',
        detail: 'On a typical grid an EV roughly cuts the same driving in this calculator. The saving grows as the grid gets cleaner.',
        saving: carKgYr - evKgYr,
      });
    }
  }

  // --- Home electricity: efficiency now, clean supply for the big cut. ---
  const grid = GRID_INTENSITY[h.region] ?? GRID_INTENSITY.world;
  const people = Math.max(1, Math.floor(clampNumber(h.household)) || 1);
  const elecKgYr = (clampNumber(h.electricityKwhMonth) * MONTHS * grid) / people;
  if (elecKgYr > 0) {
    out.push({
      category: 'home',
      title: 'Trim home electricity by about 15%',
      detail: 'LED lighting, switching appliances off standby and washing cooler add up quietly across a year.',
      saving: elecKgYr * 0.15,
    });
    out.push({
      category: 'home',
      title: 'Switch to renewable electricity or add rooftop solar',
      detail: 'Moving your supply to renewables is the rare change that cuts most of your electricity footprint at once.',
      saving: elecKgYr * 0.7,
    });
  }

  // --- Diet: nudge one rung down the ladder, never preach. ---
  const dietIndex = DIET_LADDER.indexOf(inputs.food?.diet);
  if (dietIndex > -1 && dietIndex < DIET_LADDER.length - 1) {
    const next = DIET_LADDER[dietIndex + 1];
    const saving = DIET_ANNUAL[DIET_LADDER[dietIndex]] - DIET_ANNUAL[next];
    if (saving > 0) {
      out.push({
        category: 'food',
        title: `Try shifting toward “${DIET_LABEL[next].toLowerCase()}”`,
        detail: 'Even a few more plant-based meals a week moves you down a tier. No need to change everything at once.',
        saving,
      });
    }
  }

  // --- Stuff: buy less new. ---
  if (inputs.stuff?.level === 'high') {
    out.push({
      category: 'stuff',
      title: 'Repair, borrow and buy secondhand more often',
      detail: 'Keeping devices and clothes a year or two longer avoids most of the emissions baked into making new ones.',
      saving: STUFF_ANNUAL.high - STUFF_ANNUAL.moderate,
    });
  }

  return out
    .map((a) => ({ ...a, saving: Math.round(a.saving) }))
    .filter((a) => a.saving >= MIN_SAVING)
    .sort((a, b) => b.saving - a.saving);
}
