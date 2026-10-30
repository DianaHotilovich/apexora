/** Deep links to accommodation search with the trip's dates, guests and budget already applied (no partnership needed). */
export interface StayQuery { city: string; checkIn: string; checkOut: string; guests: number; maxPerNightEur?: number }

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Default race-weekend stay: arrive Friday (2 days before the Sunday race), leave Monday. */
export function defaultStay(raceDate: string): { checkIn: string; checkOut: string } {
  return { checkIn: addDays(raceDate, -2), checkOut: addDays(raceDate, 1) };
}

export function bookingUrl(q: StayQuery): string {
  const p = new URLSearchParams({ ss: q.city, checkin: q.checkIn, checkout: q.checkOut, group_adults: String(q.guests), no_rooms: '1', group_children: '0', selected_currency: 'EUR' });
  if (q.maxPerNightEur) p.set('nflt', `price=EUR-min-${Math.round(q.maxPerNightEur)}-1`);
  return `https://www.booking.com/searchresults.html?${p.toString()}`;
}

export function airbnbUrl(q: StayQuery): string {
  const p = new URLSearchParams({ checkin: q.checkIn, checkout: q.checkOut, adults: String(q.guests), currency: 'EUR' });
  if (q.maxPerNightEur) p.set('price_max', String(Math.round(q.maxPerNightEur)));
  return `https://www.airbnb.com/s/${encodeURIComponent(q.city)}/homes?${p.toString()}`;
}

/** Polish city names in the race data → names that accommodation sites search well. */
const SEARCH_CITY: Record<string, string> = {
  'Abu Zabi': 'Abu Dhabi', Budapeszt: 'Budapest', 'Dżudda': 'Jeddah', Madryt: 'Madrid', Meksyk: 'Mexico City',
  Singapur: 'Singapore', 'Stambuł': 'Istanbul', Szanghaj: 'Shanghai', Spa: 'Spa, Belgium', Sakhir: 'Manama', Lusail: 'Doha',
};
export const searchCity = (city: string): string => SEARCH_CITY[city] ?? city;
