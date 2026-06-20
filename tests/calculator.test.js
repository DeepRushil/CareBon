import { describe, it, expect } from 'vitest';
import {
  clampNumber, calcTransport, calcHome, calcFood, calcStuff,
  calcBreakdown, toTonnes, INPUT_CAPS,
} from '../js/calculator.js';
import { DIET_ANNUAL, STUFF_ANNUAL, FLIGHT } from '../js/factors.js';

describe('clampNumber', () => {
  it('returns the number for valid positive input', () => {
    expect(clampNumber(42)).toBe(42);
    expect(clampNumber('3.5')).toBe(3.5);
  });
  it('returns 0 for invalid, negative or empty input', () => {
    expect(clampNumber('')).toBe(0);
    expect(clampNumber(-5)).toBe(0);
    expect(clampNumber('abc')).toBe(0);
    expect(clampNumber(NaN)).toBe(0);
    expect(clampNumber(undefined)).toBe(0);
  });
  it('clamps a value above the max to the max', () => {
    expect(clampNumber(9999, 5000)).toBe(5000);
    expect(clampNumber('12000', 10000)).toBe(10000);
  });
  it('leaves a value at or below the max unchanged', () => {
    expect(clampNumber(100, 5000)).toBe(100);
    expect(clampNumber(5000, 5000)).toBe(5000);
  });
  it('ignores max when it is undefined or non-positive', () => {
    expect(clampNumber(9999)).toBe(9999);
    expect(clampNumber(9999, undefined)).toBe(9999);
    expect(clampNumber(9999, -1)).toBe(9999);
    expect(clampNumber(9999, 0)).toBe(9999);
  });
});

describe('calcTransport', () => {
  it('is zero with no travel', () => {
    expect(calcTransport({})).toBe(0);
  });
  it('is zero for none fuel option even with distance', () => {
    expect(calcTransport({ carFuel: 'none', carKmWeek: 100 })).toBe(0);
  });
  it('scales car distance by fuel factor and 52 weeks', () => {
    // 100 km/week petrol @ 0.170 * 52 = 884
    expect(calcTransport({ carFuel: 'petrol', carKmWeek: 100 })).toBe(884);
  });
  it('an electric car emits far less than petrol for the same distance', () => {
    const petrol = calcTransport({ carFuel: 'petrol', carKmWeek: 100 });
    const electric = calcTransport({ carFuel: 'electric', carKmWeek: 100 });
    expect(electric).toBeLessThan(petrol);
  });
  it('adds flights correctly', () => {
    expect(calcTransport({ shortFlights: 2, longFlights: 1 }))
      .toBe(2 * FLIGHT.short_haul + FLIGHT.long_haul);
  });
  it('falls back to petrol for an unknown fuel', () => {
    expect(calcTransport({ carFuel: 'plasma', carKmWeek: 100 }))
      .toBe(calcTransport({ carFuel: 'petrol', carKmWeek: 100 }));
  });
});

describe('calcHome', () => {
  it('splits the footprint across the household', () => {
    const solo = calcHome({ region: 'world', electricityKwhMonth: 300, household: 1 });
    const shared = calcHome({ region: 'world', electricityKwhMonth: 300, household: 3 });
    expect(shared).toBe(Math.round(solo / 3));
  });
  it('treats household < 1 as 1 person', () => {
    const a = calcHome({ region: 'world', electricityKwhMonth: 300, household: 0 });
    const b = calcHome({ region: 'world', electricityKwhMonth: 300, household: 1 });
    expect(a).toBe(b);
  });
  it('a dirtier grid yields a higher footprint', () => {
    const india = calcHome({ region: 'india', electricityKwhMonth: 300 });
    const uk = calcHome({ region: 'uk', electricityKwhMonth: 300 });
    expect(india).toBeGreaterThan(uk);
  });
});

describe('calcFood & calcStuff', () => {
  it('maps diet keys to annual figures', () => {
    expect(calcFood('vegan')).toBe(DIET_ANNUAL.vegan);
    expect(calcFood('heavy_meat')).toBe(DIET_ANNUAL.heavy_meat);
  });
  it('defaults unknown diet to medium_meat', () => {
    expect(calcFood('nonsense')).toBe(DIET_ANNUAL.medium_meat);
  });
  it('maps stuff levels and defaults to moderate', () => {
    expect(calcStuff('high')).toBe(STUFF_ANNUAL.high);
    expect(calcStuff('???')).toBe(STUFF_ANNUAL.moderate);
  });
});

describe('calcBreakdown', () => {
  it('sums every category into the total', () => {
    const b = calcBreakdown({
      transport: { carFuel: 'petrol', carKmWeek: 100 },
      home: { region: 'world', electricityKwhMonth: 200 },
      food: { diet: 'vegetarian' },
      stuff: { level: 'minimal' },
    });
    expect(b.total).toBe(b.transport + b.home + b.food + b.stuff);
    expect(b.total).toBeGreaterThan(0);
  });
  it('returns only the diet + stuff baseline for an empty traveller at home', () => {
    const b = calcBreakdown({ food: { diet: 'vegan' }, stuff: { level: 'minimal' } });
    expect(b.transport).toBe(0);
    expect(b.home).toBe(0);
    expect(b.total).toBe(DIET_ANNUAL.vegan + STUFF_ANNUAL.minimal);
  });
});

describe('toTonnes', () => {
  it('converts kilograms to tonnes with two decimals', () => {
    expect(toTonnes(2345)).toBe(2.35);
    expect(toTonnes(0)).toBe(0);
    expect(toTonnes(-100)).toBe(0);
  });
});
