import { Rates } from '../types';

/**
 * Offline snapshot of ECB euro reference rates (1 EUR = x).
 * The app refreshes rates online; this snapshot is used when there is no internet.
 */
export const RATES_SNAPSHOT: Rates = {
  base: 'EUR',
  date: '2026-11-06',
  source: 'ECB euro reference rates, 06.11.2026',
  rates: {
    EUR: 1,
    PLN: 4.3925,
    USD: 1.1165,
    GBP: 0.83415,
    JPY: 176.77,
    HUF: 363.9,
    CHF: 0.9143,
    CAD: 1.5705,
    CZK: 24.35,
    AUD: 1.625,
    BRL: 6.1449,
    MXN: 20.8828,
    SGD: 1.4309,
    TRY: 55.9957,
    CNY: 7.4485,
  },
};

/** Currency used in each country on the calendar. */
export const COUNTRY_CURRENCY: Record<string, string> = {
  BH: 'BHD', SA: 'SAR', AU: 'AUD', JP: 'JPY', CN: 'CNY', US: 'USD', CA: 'CAD', MC: 'EUR', PT: 'EUR', GB: 'GBP',
  AT: 'EUR', BE: 'EUR', HU: 'HUF', IT: 'EUR', ES: 'EUR', AZ: 'AZN', TR: 'TRY', SG: 'SGD', MX: 'MXN', BR: 'BRL',
  QA: 'QAR', AE: 'AED',
};

export const USER_CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP', 'CHF', 'CZK', 'HUF', 'JPY', 'CAD'];
