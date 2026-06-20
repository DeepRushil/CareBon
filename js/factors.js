/**
 * factors.js — Emission factors and reference data.
 *
 * All figures are kilograms of CO2-equivalent (kg CO2e) unless noted.
 * These are illustrative averages drawn from widely published datasets
 * (UK DEFRA conversion factors, US EPA, IEA grid intensities, and
 * Our World in Data dietary studies). They are estimates for awareness,
 * not an audited carbon account. Keeping them in one file makes the
 * assumptions easy to review and update.
 *
 * Sources of magnitude:
 *  - Vehicle & transport per-km factors: DEFRA GHG conversion factors.
 *  - Grid intensities (kg/kWh): IEA / Ember country averages.
 *  - Dietary annual footprints: Scarborough et al.; Our World in Data.
 *  - Per-capita averages: Our World in Data (territorial emissions).
 */

// Per-kilometre factors for personal travel (kg CO2e / km).
export const TRANSPORT_PER_KM = Object.freeze({
  none: 0,
  petrol: 0.170,
  diesel: 0.165,
  hybrid: 0.110,
  electric: 0.050, // grid-dependent; a moderate-grid estimate
  motorbike: 0.103,
  bus: 0.097,
  train: 0.035,
});

// Per round-trip flight (kg CO2e). Aviation includes a radiative-forcing uplift.
export const FLIGHT = Object.freeze({
  short_haul: 500,  // e.g. a 1–3 hour regional return trip
  long_haul: 2000,  // e.g. an intercontinental return trip
});

// Electricity grid carbon intensity by region (kg CO2e / kWh).
export const GRID_INTENSITY = Object.freeze({
  india: 0.71,
  china: 0.58,
  australia: 0.66,
  us: 0.37,
  eu: 0.23,
  uk: 0.21,
  world: 0.48,
});

// Heating / cooking gas (kg CO2e / kWh of gas burned).
export const GAS_PER_KWH = 0.183;

// Annual dietary footprint by eating pattern (kg CO2e / year).
export const DIET_ANNUAL = Object.freeze({
  heavy_meat: 3300,
  medium_meat: 2500,
  low_meat: 1900,
  pescatarian: 1700,
  vegetarian: 1700,
  vegan: 1500,
});

// Ordered diet tiers, lightest last, for "next better step" suggestions.
export const DIET_LADDER = Object.freeze([
  'heavy_meat', 'medium_meat', 'low_meat', 'pescatarian', 'vegetarian', 'vegan',
]);

export const DIET_LABEL = Object.freeze({
  heavy_meat: 'Meat with most meals',
  medium_meat: 'Meat most days',
  low_meat: 'Meat a few times a week',
  pescatarian: 'Fish, no other meat',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
});

// Goods, services and other consumption (kg CO2e / year).
export const STUFF_ANNUAL = Object.freeze({
  minimal: 600,
  moderate: 1500,
  high: 3000,
});

export const STUFF_LABEL = Object.freeze({
  minimal: 'I rarely buy new things',
  moderate: 'Average shopping habits',
  high: 'I shop and upgrade often',
});

// Per-capita annual footprints for context (tonnes CO2e / year).
export const BENCHMARK_TONNES = Object.freeze({
  target_2030: 2.3, // climate-safe individual target
  india: 1.9,
  world: 4.7,
  eu: 6.8,
  us: 14.3,
});

// Gauge scale: the meter runs 0 → MAX tonnes; the green band sits under target.
export const GAUGE_MAX_TONNES = 8;
