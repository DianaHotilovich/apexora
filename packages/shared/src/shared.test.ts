import { describe, expect, it } from 'vitest';
import {
  GUIDES, OFFERS, RACES, RATES_SNAPSHOT, checklistFor, convert, daysUntil, formatMoney, getGuide,
  MissingRateError, savingsPlan, suggestTrip, summarizeTrip,
} from './index';

describe('data', () => {
  it('has 24 races in the 2027 calendar, in round order', () => {
    expect(RACES).toHaveLength(24);
    expect(RACES.map((r) => r.round)).toEqual([...Array(24)].map((_, i) => i + 1));
  });
  it('has a guide for every race country', () => {
    for (const r of RACES) expect(getGuide(r.countryCode), r.id).toBeDefined();
    expect(GUIDES).toHaveLength(22);
  });
  it('every offer points to an existing race and has a source', () => {
    for (const o of OFFERS) {
      expect(RACES.some((r) => r.id === o.raceId)).toBe(true);
      expect(o.source.length).toBeGreaterThan(5);
    }
  });
  it('marks Middle East races as uncertain', () => {
    expect(RACES.filter((r) => r.status === 'uncertain').map((r) => r.countryCode).sort()).toEqual(['AE', 'BH', 'QA', 'SA']);
  });
});

describe('money', () => {
  it('converts through EUR', () => {
    expect(convert(100, 'EUR', 'PLN', RATES_SNAPSHOT)).toBeCloseTo(440.38, 2);
    expect(convert(440.38, 'PLN', 'EUR', RATES_SNAPSHOT)).toBeCloseTo(100, 2);
  });
  it('throws for unknown currencies', () => {
    expect(() => convert(1, 'XXX', 'PLN', RATES_SNAPSHOT)).toThrow(MissingRateError);
  });
  it('formats Polish złoty', () => {
    expect(formatMoney(12345, 'PLN').replace(/\s/g, ' ')).toBe('12 345 zł');
  });
});

describe('trip', () => {
  it('suggests ticket + package for the budget Hungarian GP', () => {
    const items = suggestTrip('hungary-2027', 'budget', RATES_SNAPSHOT);
    expect(items.map((i) => i.offerId).sort()).toEqual(['hu-pkg-budget', 'hu-ticket-ga']);
  });
  it('prices the standard Hungarian GP trip at 4 040 PLN', () => {
    const s = summarizeTrip([{ offerId: 'hu-ticket-fan', quantity: 1 }, { offerId: 'hu-pkg-standard', quantity: 1 }], 'PLN', RATES_SNAPSHOT);
    expect(Math.round(s.total)).toBe(4040);
    expect(s.missing).toEqual([]);
    expect(s.totalEur).toBeCloseTo(4040 / 4.4038, 1);
  });
  it('reports missing parts', () => {
    const s = summarizeTrip([{ offerId: 'cn-ticket-ga', quantity: 1 }], 'PLN', RATES_SNAPSHOT);
    expect(s.missing).toEqual(['stay', 'transport']);
  });
  it('rejects bad quantities and unknown offers', () => {
    expect(() => summarizeTrip([{ offerId: 'hu-ticket-fan', quantity: 0 }], 'PLN', RATES_SNAPSHOT)).toThrow();
    expect(() => summarizeTrip([{ offerId: 'nope', quantity: 1 }], 'PLN', RATES_SNAPSHOT)).toThrow();
  });
  it('plans savings per month', () => {
    expect(savingsPlan(4040, '2026-10-30', '2027-07-30')).toEqual({ months: 9, monthly: 449 });
  });
  it('counts days to the race', () => {
    expect(daysUntil('2027-08-01', '2026-10-30')).toBe(275);
  });
});

describe('checklist', () => {
  it('asks for an ID card in the EU and a passport outside', () => {
    expect(checklistFor('HU', '2027-08-01', 'pl').map((i) => i.id)).toContain('id');
    expect(checklistFor('JP', '2027-04-11', 'en').map((i) => i.id)).toContain('passport');
  });
  it('adds sunscreen only in summer months', () => {
    expect(checklistFor('HU', '2027-08-01', 'pl').map((i) => i.id)).toContain('sun');
    expect(checklistFor('AE', '2027-12-12', 'pl').map((i) => i.id)).not.toContain('sun');
  });
});

import { bookingUrl, airbnbUrl, defaultStay } from './stay';
describe('stay deep links', () => {
  it('builds dated, filtered Booking and Airbnb searches', () => {
    const d = defaultStay('2027-08-01');
    expect(d).toEqual({ checkIn: '2027-07-30', checkOut: '2027-08-02' });
    const b = new URL(bookingUrl({ city: 'Budapest', ...d, guests: 2, maxPerNightEur: 120 }));
    expect(b.searchParams.get('checkin')).toBe('2027-07-30');
    expect(b.searchParams.get('group_adults')).toBe('2');
    expect(b.searchParams.get('nflt')).toBe('price=EUR-min-120-1');
    const a = new URL(airbnbUrl({ city: 'Budapest', ...d, guests: 2, maxPerNightEur: 120 }));
    expect(a.pathname).toBe('/s/Budapest/homes');
    expect(a.searchParams.get('price_max')).toBe('120');
  });
});
