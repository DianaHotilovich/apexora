import { Lang, Localized } from './types';

const EU = ['AT', 'BE', 'HU', 'IT', 'ES', 'PT'];

interface Item { id: string; text: Localized; when?: (code: string, month: number) => boolean }

const ITEMS: Item[] = [
  { id: 'ticket', text: { pl: 'Bilet na wyścig zapisany offline', en: 'Race ticket saved offline' } },
  { id: 'id', text: { pl: 'Dowód osobisty lub paszport', en: 'ID card or passport' }, when: (c) => EU.includes(c) },
  { id: 'passport', text: { pl: 'Paszport (ważny min. 6 miesięcy) i sprawdzona wiza', en: 'Passport (valid 6+ months) and visa checked' }, when: (c) => !EU.includes(c) },
  { id: 'ehic', text: { pl: 'Karta EKUZ i ubezpieczenie podróżne', en: 'EHIC card and travel insurance' }, when: (c) => EU.includes(c) },
  { id: 'insurance', text: { pl: 'Ubezpieczenie podróżne z kosztami leczenia', en: 'Travel insurance with medical cover' }, when: (c) => !EU.includes(c) },
  { id: 'guide', text: { pl: 'Przewodnik po kraju (PDF) w telefonie', en: 'Country guide (PDF) on your phone' } },
  { id: 'hotel', text: { pl: 'Adres hotelu w lokalnym języku', en: 'Hotel address in the local language' } },
  { id: 'cash', text: { pl: 'Trochę gotówki w lokalnej walucie', en: 'Some cash in the local currency' } },
  { id: 'sim', text: { pl: 'Internet: roaming, lokalna karta SIM albo eSIM', en: 'Mobile data: roaming, local SIM or eSIM' } },
  { id: 'ear', text: { pl: 'Zatyczki do uszu', en: 'Earplugs' } },
  { id: 'power', text: { pl: 'Powerbank', en: 'Power bank' } },
  { id: 'sun', text: { pl: 'Czapka i krem z filtrem', en: 'Cap and sunscreen' }, when: (_c, m) => m >= 4 && m <= 9 },
  { id: 'rain', text: { pl: 'Kurtka przeciwdeszczowa', en: 'Rain jacket' } },
];

export function checklistFor(countryCode: string, raceDateIso: string, lang: Lang): { id: string; text: string }[] {
  const month = new Date(raceDateIso).getMonth() + 1;
  return ITEMS.filter((i) => !i.when || i.when(countryCode, month)).map((i) => ({ id: i.id, text: i.text[lang] }));
}
