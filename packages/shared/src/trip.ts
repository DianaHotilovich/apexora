import { OFFERS } from './data/offers';
import { RACES } from './data/races';
import { convert } from './money';
import { Level, Offer, OfferType, Race, Rates, TripItem, TripSummary } from './types';

export function getRace(id: string, races: Race[] = RACES): Race | undefined {
  return races.find((r) => r.id === id);
}

export function offersForRace(raceId: string, level?: Level, offers: Offer[] = OFFERS): Offer[] {
  return offers.filter((o) => o.raceId === raceId && (!level || o.level === level));
}

/**
 * Suggest a package for a level: a combined package (stay + transport) plus a ticket,
 * or separate parts when there is no package. Picks the cheapest matching offer of each kind.
 */
export function suggestTrip(raceId: string, level: Level, rates: Rates, offers: Offer[] = OFFERS): TripItem[] {
  const own = offersForRace(raceId, level, offers);
  const pool = own.length ? own : offersForRace(raceId, undefined, offers);
  const cheapest = (list: Offer[]) =>
    [...list].sort((a, b) => convert(a.price, a.currency, 'EUR', rates) - convert(b.price, b.currency, 'EUR', rates))[0];
  const picked: Offer[] = [];
  const covered = new Set<OfferType>();
  const all = [...pool].sort((a, b) => b.includes.length - a.includes.length);
  for (const o of all) {
    const adds = o.includes.filter((t) => !covered.has(t));
    if (!adds.length) continue;
    const sameKind = all.filter((x) => x.includes.join() === o.includes.join());
    const best = cheapest(sameKind);
    if (picked.includes(best)) continue;
    picked.push(best);
    best.includes.forEach((t) => covered.add(t));
  }
  return picked.map((o) => ({ offerId: o.id, quantity: 1 }));
}

/** Price a trip in the user's currency and in EUR, and report which parts are still missing. */
export function summarizeTrip(items: TripItem[], userCurrency: string, rates: Rates, offers: Offer[] = OFFERS): TripSummary {
  const lines = items.map((it) => {
    const offer = offers.find((o) => o.id === it.offerId);
    if (!offer) throw new Error(`Unknown offer ${it.offerId}`);
    if (!Number.isInteger(it.quantity) || it.quantity < 1) throw new Error('Quantity must be a positive integer');
    return { ...it, offer, lineTotal: convert(offer.price * it.quantity, offer.currency, userCurrency, rates) };
  });
  const total = lines.reduce((s, l) => s + l.lineTotal, 0);
  const covered = new Set(lines.flatMap((l) => l.offer.includes));
  const missing = (['ticket', 'stay', 'transport'] as OfferType[]).filter((t) => !covered.has(t));
  return { items: lines, total, currency: userCurrency, totalEur: convert(total, userCurrency, 'EUR', rates), missing };
}

/** "Save for the trip": monthly amount needed to reach the total before a deadline. */
export function savingsPlan(total: number, fromIso: string, deadlineIso: string): { months: number; monthly: number } {
  const from = new Date(fromIso);
  const to = new Date(deadlineIso);
  const months = Math.max(1, (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()));
  return { months, monthly: Math.ceil(total / months) };
}

export function daysUntil(dateIso: string, todayIso: string): number {
  const ms = new Date(dateIso + 'T00:00:00Z').getTime() - new Date(todayIso + 'T00:00:00Z').getTime();
  return Math.round(ms / 86_400_000);
}

/** The next Grand Prix to recommend: the nearest race that has not finished yet, skipping races whose status is uncertain. */
export function nextRace(today: string, races = RACES) {
  const upcoming = races.filter((r) => r.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  return upcoming.find((r) => r.status !== 'uncertain') ?? upcoming[0] ?? null;
}
