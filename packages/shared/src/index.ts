import guidesJson from './data/guides.json';
import { Guide } from './types';

export * from './types';
export * from './money';
export * from './trip';
export * from './checklist';
export * from './payments';
export { RACES } from './data/races';
export { OFFERS } from './data/offers';
export { RATES_SNAPSHOT, COUNTRY_CURRENCY, USER_CURRENCIES } from './data/rates';

/** One-page country guides for every country on the 2027 calendar (Polish and English). */
export const GUIDES = guidesJson as Guide[];

export function getGuide(code: string): Guide | undefined {
  return GUIDES.find((g) => g.code === code.toUpperCase());
}
export * from './i18n';
