export type Lang = 'pl' | 'en';
export type Localized = Record<Lang, string>;
export type Level = 'budget' | 'standard' | 'premium';
export type OfferType = 'ticket' | 'stay' | 'transport' | 'package';
export type Region = 'eu' | 'eu2' | 'me' | 'ap' | 'am';

export interface Race {
  id: string;
  round: number;
  name: Localized;
  countryCode: string;
  circuit: string;
  city: string;
  /** Race day (Sunday), ISO date */
  date: string;
  status: 'confirmed' | 'uncertain';
  officialTicketsUrl: string;
}

export interface Guide {
  code: string;
  region: Region;
  name: Localized;
  gpLabel: Localized;
  place: Localized;
  sos: { number: string; label: Localized }[];
  warning: Localized;
  sim: Localized;
  transport: Localized;
  money: Localized;
  language: Localized;
  phrases: { text: Localized; local: string }[];
  sources: Localized;
}

export interface Offer {
  id: string;
  raceId: string;
  type: OfferType;
  level: Level;
  title: Localized;
  details: Localized;
  /** Price per person in `currency` */
  price: number;
  currency: string;
  /** Does the price already include the race ticket / stay / transport? */
  includes: OfferType[];
  partner: string;
  url: string;
  /** Where the price comes from and when it was checked */
  source: string;
  isEstimate: boolean;
}

export interface Rates {
  base: 'EUR';
  date: string;
  source: string;
  rates: Record<string, number>;
}

export interface TripItem { offerId: string; quantity: number }

export interface TripSummary {
  items: (TripItem & { offer: Offer; lineTotal: number })[];
  /** Totals in the user's currency */
  total: number;
  currency: string;
  /** Total in EUR (second currency shown everywhere) */
  totalEur: number;
  missing: OfferType[];
}

export type PaymentMethod = 'pay_now' | 'instalments' | 'save_up' | 'split';
