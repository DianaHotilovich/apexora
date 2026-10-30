import {
  checklistFor, getGuide, getRace, GUIDES, Lang, Level, methodsFor, OFFERS, offersForRace, PaymentMethod, RACES,
  Rates, RATES_SNAPSHOT, suggestTrip, summarizeTrip, TripItem, TripSummary,
} from '@gridtrip/shared';
import { load, save } from './store';

/**
 * Data access for the web app.
 * With NEXT_PUBLIC_API_URL the app talks to the GridTrip API; without it, it runs in demo mode
 * on the same shared data and logic, entirely in the browser (and offline).
 */
const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
export const DEMO = !API;

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.message || res.statusText), { status: res.status });
  }
  return res.json();
}

export const races = () => RACES;
export const race = (id: string) => getRace(id);
export const offers = (raceId: string, level?: Level) => offersForRace(raceId, level);
export const guides = () => GUIDES;
export const guide = (code: string) => getGuide(code);
export const checklist = (code: string, date: string, lang: Lang) => checklistFor(code, date, lang);
export const paymentMethods = (country: string) => methodsFor(country);
export const offerById = (id: string) => OFFERS.find((o) => o.id === id);

export async function rates(): Promise<Rates & { live: boolean }> {
  if (!DEMO) {
    try {
      const r = await api<Rates & { live: boolean }>('/rates');
      save('rates', r);
      return r;
    } catch {
      /* offline: fall through */
    }
  }
  return { ...(load<Rates>('rates') ?? RATES_SNAPSHOT), live: false };
}

export function suggest(raceId: string, level: Level, r: Rates): TripItem[] {
  return suggestTrip(raceId, level, r);
}

export function quote(items: TripItem[], currency: string, r: Rates): TripSummary {
  return summarizeTrip(items, currency, r);
}

export interface SavedTrip {
  id: string; raceId: string; level: Level; currency: string; items: TripItem[]; total: number;
  status: 'planned' | 'paid' | 'payment_pending' | 'scheduled'; method?: PaymentMethod; hotel?: string; done?: string[];
}

export async function createAndPay(
  trip: Omit<SavedTrip, 'id' | 'status'>, method: PaymentMethod, country: string,
): Promise<SavedTrip & { redirectUrl?: string }> {
  if (DEMO) {
    const status = method === 'pay_now' ? 'paid' : method === 'save_up' ? 'scheduled' : 'payment_pending';
    const saved: SavedTrip = { ...trip, id: `demo-${Date.now()}`, status, method };
    save('trip', saved);
    return saved;
  }
  const created = await api<{ id: string }>('/trips', { method: 'POST', body: JSON.stringify({ raceId: trip.raceId, level: trip.level, currency: trip.currency, items: trip.items }) });
  const payment = await api<{ status: string; redirectUrl?: string }>('/payments', { method: 'POST', body: JSON.stringify({ tripId: created.id, method, country }) });
  const status = payment.status === 'authorised' ? 'paid' : payment.status === 'scheduled' ? 'scheduled' : 'payment_pending';
  const saved: SavedTrip = { ...trip, id: created.id, status, method };
  save('trip', saved);
  return { ...saved, redirectUrl: payment.redirectUrl };
}

export async function joinWaitlist(email: string, lang: Lang): Promise<'joined' | 'already'> {
  if (DEMO) {
    const list = load<string[]>('waitlist') ?? [];
    const e = email.trim().toLowerCase();
    if (list.includes(e)) return 'already';
    save('waitlist', [...list, e]);
    return 'joined';
  }
  try {
    await api('/waitlist', { method: 'POST', body: JSON.stringify({ email, language: lang }) });
    return 'joined';
  } catch (e) {
    if ((e as { status?: number }).status === 409) return 'already';
    throw e;
  }
}
