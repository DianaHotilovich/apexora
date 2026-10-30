import { PaymentMethod } from './types';

/** Instalment (BNPL) partners by country, from the GridTrip partner research (October 2026). */
export const BNPL_BY_COUNTRY: Record<string, string[]> = {
  PL: ['PayPo', 'Klarna'], AT: ['Klarna'], BE: ['Klarna'], CZ: ['Klarna'], DK: ['Klarna'], FI: ['Klarna'],
  FR: ['Klarna', 'PayPal Pay Later'], GR: ['Klarna'], ES: ['Klarna', 'PayPal Pay Later'], NL: ['Klarna'], IE: ['Klarna'],
  DE: ['Klarna', 'PayPal Pay Later'], NO: ['Klarna'], PT: ['Klarna'], RO: ['Klarna'], SK: ['Klarna'], CH: ['Klarna'],
  SE: ['Klarna'], HU: ['Klarna'], IT: ['Klarna', 'PayPal Pay Later'], GB: ['Klarna', 'PayPal Pay Later', 'Affirm'],
  US: ['PayPal Pay Later', 'Affirm', 'Zip'], CA: ['PayPal Pay Later', 'Affirm'], AU: ['PayPal Pay Later', 'Zip'],
  SA: ['Tabby', 'Tamara'], AE: ['Tabby', 'Tamara'], SG: ['Atome'], MY: ['Atome'], PH: ['Atome'], ID: ['Atome'],
  JP: ['Paidy', 'Card instalments'], BR: ['Card instalments'], MX: ['Card instalments'], UA: ['monobank'],
};

export function methodsFor(country: string): { method: PaymentMethod; available: boolean; partners?: string[] }[] {
  const partners = BNPL_BY_COUNTRY[country.toUpperCase()] ?? [];
  return [
    { method: 'pay_now', available: true },
    { method: 'instalments', available: partners.length > 0, partners },
    // Not a loan, so it works in every country where any payment works.
    { method: 'save_up', available: true },
    { method: 'split', available: true },
  ];
}

