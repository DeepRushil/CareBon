/**
 * calculator.js — Pure functions that turn user inputs into a footprint.
 *
 * Every function here is deterministic and side-effect free so the numbers
 * can be unit-tested directly. The UI layer never does arithmetic itself.
 * All returned values are kilograms of CO2e per year.
 */

import {
  TRANSPORT_PER_KM, FLIGHT, GRID_INTENSITY, GAS_PER_KWH,
  DIET_ANNUAL, STUFF_ANNUAL,
} from './factors.js';

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

/** Per-field input ceilings — matches the HTML max attributes exactly. */
export const INPUT_CAPS = Object.freeze({
  carKmWeek: 5000,
  busKmWeek: 5000,
  trainKmWeek: 5000,
  shortFlights: 50,
  longFlights: 50,
  electricityKwhMonth: 10000,
  gasKwhMonth: 10000,
  household: 30,
});

/** Coerce any input to a non-negative finite number; bad input becomes 0.
 *  If `max` is a positive number the result is also clamped at that ceiling. */
export function clampNumber(value, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return (Number.isFinite(max) && max > 0) ? Math.min(n, max) : n;
}

/**
 * Travel emissions: weekly car + transit kilometres plus annual flights.
 * @param {object} t
 * @param {string} t.carFuel   key of TRANSPORT_PER_KM
 * @param {number} t.carKmWeek kilometres driven per week
 * @param {number} t.busKmWeek bus kilometres per week
 * @param {number} t.trainKmWeek train kilometres per week
 * @param {number} t.shortFlights short-haul return flights per year
 * @param {number} t.longFlights long-haul return flights per year
 */
export function calcTransport(t = {}) {
  const carFactor = TRANSPORT_PER_KM[t.carFuel] ?? TRANSPORT_PER_KM.petrol;
  const car = clampNumber(t.carKmWeek, INPUT_CAPS.carKmWeek) * WEEKS_PER_YEAR * carFactor;
  const bus = clampNumber(t.busKmWeek, INPUT_CAPS.busKmWeek) * WEEKS_PER_YEAR * TRANSPORT_PER_KM.bus;
  const train = clampNumber(t.trainKmWeek, INPUT_CAPS.trainKmWeek) * WEEKS_PER_YEAR * TRANSPORT_PER_KM.train;
  const flights =
    clampNumber(t.shortFlights, INPUT_CAPS.shortFlights) * FLIGHT.short_haul +
    clampNumber(t.longFlights, INPUT_CAPS.longFlights) * FLIGHT.long_haul;
  return round(car + bus + train + flights);
}

/**
 * Home energy emissions from electricity and (optional) gas.
 * @param {object} h
 * @param {string} h.region        key of GRID_INTENSITY
 * @param {number} h.electricityKwhMonth kWh of electricity per month
 * @param {number} h.gasKwhMonth    kWh of gas per month (heating/cooking)
 * @param {number} h.household      people sharing the home (footprint is split)
 */
export function calcHome(h = {}) {
  const grid = GRID_INTENSITY[h.region] ?? GRID_INTENSITY.world;
  const people = Math.max(1, Math.floor(clampNumber(h.household, INPUT_CAPS.household)) || 1);
  const electricity = clampNumber(h.electricityKwhMonth, INPUT_CAPS.electricityKwhMonth) * MONTHS_PER_YEAR * grid;
  const gas = clampNumber(h.gasKwhMonth, INPUT_CAPS.gasKwhMonth) * MONTHS_PER_YEAR * GAS_PER_KWH;
  return round((electricity + gas) / people);
}

/** Diet emissions from a chosen eating pattern. */
export function calcFood(diet) {
  return round(DIET_ANNUAL[diet] ?? DIET_ANNUAL.medium_meat);
}

/** Goods, services and other consumption from a chosen spending level. */
export function calcStuff(level) {
  return round(STUFF_ANNUAL[level] ?? STUFF_ANNUAL.moderate);
}

/**
 * Combine every category into a full breakdown.
 * @returns {{transport:number, home:number, food:number, stuff:number, total:number}}
 */
export function calcBreakdown(inputs = {}) {
  const transport = calcTransport(inputs.transport);
  const home = calcHome(inputs.home);
  const food = calcFood(inputs.food?.diet);
  const stuff = calcStuff(inputs.stuff?.level);
  const total = round(transport + home + food + stuff);
  return { transport, home, food, stuff, total };
}

/** Kilograms → tonnes, rounded to two decimals. */
export function toTonnes(kg) {
  return Math.round((clampNumber(kg) / 1000) * 100) / 100;
}

function round(n) {
  return Math.round(n);
}
