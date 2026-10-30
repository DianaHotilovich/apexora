import { Rates } from './types';

export class MissingRateError extends Error {
  constructor(public currency: string) {
    super(`No exchange rate for ${currency}`);
  }
}

export function hasRate(rates: Rates, currency: string): boolean {
  return typeof rates.rates[currency] === 'number' && rates.rates[currency] > 0;
}

/** Convert an amount between currencies through EUR (ECB rates are quoted as 1 EUR = x). */
export function convert(amount: number, from: string, to: string, rates: Rates): number {
  if (from === to) return amount;
  if (!hasRate(rates, from)) throw new MissingRateError(from);
  if (!hasRate(rates, to)) throw new MissingRateError(to);
  const inEur = amount / rates.rates[from];
  return inEur * rates.rates[to];
}

/** Round money for display: no decimals for large amounts, 2 decimals otherwise. */
export function roundMoney(amount: number, currency: string): number {
  const noDecimals = ['JPY', 'HUF'].includes(currency) || amount >= 1000;
  return noDecimals ? Math.round(amount) : Math.round(amount * 100) / 100;
}

export function formatMoney(amount: number, currency: string, locale = 'pl-PL'): string {
  const value = roundMoney(amount, currency);
  const digits = Number.isInteger(value) ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(value);
}
