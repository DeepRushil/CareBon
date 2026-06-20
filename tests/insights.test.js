import { describe, it, expect } from 'vitest';
import { generateInsights } from '../js/insights.js';
import { calcBreakdown } from '../js/calculator.js';
import { FLIGHT } from '../js/factors.js';

function withBreakdown(inputs) {
  return generateInsights(inputs, calcBreakdown(inputs));
}

describe('generateInsights', () => {
  it('returns nothing meaningful for an essentially empty profile', () => {
    const out = withBreakdown({ food: { diet: 'vegan' }, stuff: { level: 'minimal' } });
    // vegan + minimal leaves no actionable lever above the threshold
    expect(out.every((a) => a.saving >= 50)).toBe(true);
  });

  it('ranks actions from largest saving to smallest', () => {
    const out = withBreakdown({
      transport: { carFuel: 'petrol', carKmWeek: 200, longFlights: 1 },
      home: { region: 'india', electricityKwhMonth: 400 },
      food: { diet: 'heavy_meat' },
      stuff: { level: 'high' },
    });
    for (let i = 1; i < out.length; i++) {
      expect(out[i - 1].saving).toBeGreaterThanOrEqual(out[i].saving);
    }
  });

  it('puts a long-haul flight at the top for an otherwise light profile', () => {
    const out = withBreakdown({
      transport: { longFlights: 1 },
      food: { diet: 'low_meat' },
      stuff: { level: 'minimal' },
    });
    expect(out[0].category).toBe('transport');
    expect(out[0].saving).toBe(FLIGHT.long_haul);
  });

  it('suggests an EV only for petrol or diesel drivers', () => {
    const petrol = withBreakdown({ transport: { carFuel: 'petrol', carKmWeek: 150 } });
    const electric = withBreakdown({ transport: { carFuel: 'electric', carKmWeek: 150 } });
    expect(petrol.some((a) => a.title.includes('electric'))).toBe(true);
    expect(electric.some((a) => a.title.includes('Make your next car electric'))).toBe(false);
  });

  it('never suggests going below vegan', () => {
    const out = withBreakdown({ food: { diet: 'vegan' }, transport: { carFuel: 'petrol', carKmWeek: 100 } });
    expect(out.some((a) => a.category === 'food')).toBe(false);
  });

  it('produces integer savings only', () => {
    const out = withBreakdown({ home: { region: 'us', electricityKwhMonth: 333 } });
    out.forEach((a) => expect(Number.isInteger(a.saving)).toBe(true));
  });

  it('suggests train for short-haul flight passengers', () => {
    const out = withBreakdown({ transport: { shortFlights: 2 } });
    expect(out.some((a) => a.title.includes('Take the train'))).toBe(true);
  });

  it('suggests shifting car trips for active drivers', () => {
    const out = withBreakdown({ transport: { carFuel: 'petrol', carKmWeek: 100 } });
    expect(out.some((a) => a.title.includes('Move a fifth of car trips'))).toBe(true);
  });

  it('suggests electricity trimming and renewable options', () => {
    const out = withBreakdown({ home: { region: 'us', electricityKwhMonth: 300, household: 1 } });
    expect(out.some((a) => a.title.includes('Trim home electricity'))).toBe(true);
    expect(out.some((a) => a.title.includes('renewable electricity'))).toBe(true);
  });

  it('suggests repairing/borrowing for high stuff buyers', () => {
    const out = withBreakdown({ stuff: { level: 'high' } });
    expect(out.some((a) => a.title.includes('Repair, borrow and buy secondhand'))).toBe(true);
  });

  it('handles empty/missing inputs gracefully', () => {
    const out = generateInsights(undefined, undefined);
    expect(out).toBeInstanceOf(Array);
    expect(out).toHaveLength(0);
  });
});
