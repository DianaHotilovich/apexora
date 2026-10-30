import { Rates } from '../types';

/**
 * Offline snapshot of ECB euro reference rates (1 EUR = x).
 * The app refreshes rates online; this snapshot is used when there is no internet.
 */
export const RATES_SNAPSHOT: Rates = {
  base: 'EUR',
  date: '2026-10-30',
  source: 'ECB euro reference rates, 30.10.2026',
  rates: {
    EUR: 1,
    PLN: 4.4038,
    USD: 1.1172,
    GBP: 0.8338,
    JPY: 175.68,
    HUF: 366.33,
    CHF: 0.9194,
    CAD: 1.5606,
    CZK: 24.353,
    AUD: 1.5904,
    BRL: 6.0692,
    MXN: 21.1237,
    SGD: 1.4282,
    TRY: 55.8015,
    CNY: 7.4326,
  },
};

/** Currency used in each country on the calendar. */
export const COUNTRY_CURRENCY: Record<string, string> = {
  BH: 'BHD', SA: 'SAR', AU: 'AUD', JP: 'JPY', CN: 'CNY', US: 'USD', CA: 'CAD', MC: 'EUR', PT: 'EUR', GB: 'GBP',
  AT: 'EUR', BE: 'EUR', HU: 'HUF', IT: 'EUR', ES: 'EUR', AZ: 'AZN', TR: 'TRY', SG: 'SGD', MX: 'MXN', BR: 'BRL',
  QA: 'QAR', AE: 'AED',
};

export const USER_CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP', 'CHF', 'CZK', 'HUF', 'JPY', 'CAD'];
