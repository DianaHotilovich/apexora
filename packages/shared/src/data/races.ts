import { Race } from '../types';

const F1 = 'https://ticketing.formula1.com';

/** 2027 Formula 1 calendar as used in the GridTrip research (status: October 2026). */
export const RACES: Race[] = [
  { id: 'bahrain-2027', round: 1, name: { pl: 'GP Bahrajnu', en: 'Bahrain GP' }, countryCode: 'BH', circuit: 'Bahrain International Circuit', city: 'Sakhir', date: '2027-03-14', status: 'uncertain', officialTicketsUrl: F1 },
  { id: 'saudi-2027', round: 2, name: { pl: 'GP Arabii Saudyjskiej', en: 'Saudi Arabian GP' }, countryCode: 'SA', circuit: 'Jeddah Corniche Circuit', city: 'Dżudda', date: '2027-03-21', status: 'uncertain', officialTicketsUrl: F1 },
  { id: 'australia-2027', round: 3, name: { pl: 'GP Australii', en: 'Australian GP' }, countryCode: 'AU', circuit: 'Albert Park', city: 'Melbourne', date: '2027-04-04', status: 'confirmed', officialTicketsUrl: F1 },
  { id: 'japan-2027', round: 4, name: { pl: 'GP Japonii', en: 'Japanese GP' }, countryCode: 'JP', circuit: 'Suzuka', city: 'Suzuka', date: '2027-04-11', status: 'confirmed', officialTicketsUrl: 'https://www.suzukacircuit.jp/eng/f1/faq/faq_ticket.html' },
  { id: 'china-2027', round: 5, name: { pl: 'GP Chin', en: 'Chinese GP' }, countryCode: 'CN', circuit: 'Shanghai International Circuit', city: 'Szanghaj', date: '2027-04-18', status: 'confirmed', officialTicketsUrl: F1 },
  { id: 'miami-2027', round: 6, name: { pl: 'GP Miami', en: 'Miami GP' }, countryCode: 'US', circuit: 'Miami International Autodrome', city: 'Miami', date: '2027-05-02', status: 'confirmed', officialTicketsUrl: F1 },
  { id: 'canada-2027', round: 7, name: { pl: 'GP Kanady', en: 'Canadian GP' }, countryCode: 'CA', circuit: 'Circuit Gilles Villeneuve', city: 'Montreal', date: '2027-05-23', status: 'confirmed', officialTicketsUrl: F1 },
  { id: 'monaco-2027', round: 8, name: { pl: 'GP Monako', en: 'Monaco GP' }, countryCode: 'MC', circuit: 'Circuit de Monaco', city: 'Monte Carlo', date: '2027-06-06', status: 'confirmed', officialTicketsUrl: F1 },
  { id: 'portugal-2027', round: 9, name: { pl: 'GP Portugalii', en: 'Portuguese GP' }, countryCode: 'PT', circuit: 'Autódromo Internacional do Algarve', city: 'Portimão', date: '2027-06-20', status: 'confirmed', officialTicketsUrl: F1 },
  { id: 'britain-2027', round: 10, name: { pl: 'GP Wielkiej Brytanii', en: 'British GP' }, countryCode: 'GB', circuit: 'Silverstone', city: 'Silverstone', date: '2027-07-04', status: 'confirmed', officialTicketsUrl: 'https://ticketing.formula1.com/tickets/en/great-britain/general-admission-f1-silverstone-waitlist' },
  { id: 'austria-2027', round: 11, name: { pl: 'GP Austrii', en: 'Austrian GP' }, countryCode: 'AT', circuit: 'Red Bull Ring', city: 'Spielberg', date: '2027-07-11', status: 'confirmed', officialTicketsUrl: 'https://tickets.redbullring.com/en/f1/f1-grand-prix-austria/camping.html' },
  { id: 'belgium-2027', round: 12, name: { pl: 'GP Belgii', en: 'Belgian GP' }, countryCode: 'BE', circuit: 'Spa-Francorchamps', city: 'Spa', date: '2027-07-25', status: 'confirmed', officialTicketsUrl: 'https://www.spagrandprix.com/en/young-village' },
  { id: 'hungary-2027', round: 13, name: { pl: 'GP Węgier', en: 'Hungarian GP' }, countryCode: 'HU', circuit: 'Hungaroring', city: 'Budapeszt', date: '2027-08-01', status: 'confirmed', officialTicketsUrl: 'https://ticketing.formula1.com/tickets/en/hungary/general-admission-f1-hungaroring' },
  { id: 'italy-2027', round: 14, name: { pl: 'GP Włoch', en: 'Italian GP' }, countryCode: 'IT', circuit: 'Monza', city: 'Monza', date: '2027-09-05', status: 'confirmed', officialTicketsUrl: 'https://www.ticketone.it/event/formula-1-gran-premio-ditalia-2027-autodromo-nazionale-monza-22004717/' },
  { id: 'spain-2027', round: 15, name: { pl: 'GP Hiszpanii', en: 'Spanish GP' }, countryCode: 'ES', circuit: 'Madring', city: 'Madryt', date: '2027-09-12', status: 'confirmed', officialTicketsUrl: 'https://ticketsf1.madring.com' },
  { id: 'azerbaijan-2027', round: 16, name: { pl: 'GP Azerbejdżanu', en: 'Azerbaijan GP' }, countryCode: 'AZ', circuit: 'Baku City Circuit', city: 'Baku', date: '2027-09-26', status: 'confirmed', officialTicketsUrl: F1 },
  { id: 'turkey-2027', round: 17, name: { pl: 'GP Turcji', en: 'Turkish GP' }, countryCode: 'TR', circuit: 'Istanbul Park', city: 'Stambuł', date: '2027-10-03', status: 'confirmed', officialTicketsUrl: F1 },
  { id: 'singapore-2027', round: 18, name: { pl: 'GP Singapuru', en: 'Singapore GP' }, countryCode: 'SG', circuit: 'Marina Bay', city: 'Singapur', date: '2027-10-10', status: 'confirmed', officialTicketsUrl: F1 },
  { id: 'usa-2027', round: 19, name: { pl: 'GP USA', en: 'United States GP' }, countryCode: 'US', circuit: 'Circuit of the Americas', city: 'Austin', date: '2027-10-24', status: 'confirmed', officialTicketsUrl: F1 },
  { id: 'mexico-2027', round: 20, name: { pl: 'GP Meksyku', en: 'Mexico City GP' }, countryCode: 'MX', circuit: 'Autódromo Hermanos Rodríguez', city: 'Meksyk', date: '2027-10-31', status: 'confirmed', officialTicketsUrl: 'https://www.ticketmaster.com.mx/formula-1-gran-premio-de-la-ciudad-de-mexico-boletos/artist/2085922' },
  { id: 'brazil-2027', round: 21, name: { pl: 'GP São Paulo', en: 'São Paulo GP' }, countryCode: 'BR', circuit: 'Interlagos', city: 'São Paulo', date: '2027-11-07', status: 'confirmed', officialTicketsUrl: 'https://www.eventim.com.br/campaign/f1saopaulo' },
  { id: 'lasvegas-2027', round: 22, name: { pl: 'GP Las Vegas', en: 'Las Vegas GP' }, countryCode: 'US', circuit: 'Las Vegas Strip Circuit', city: 'Las Vegas', date: '2027-11-20', status: 'confirmed', officialTicketsUrl: F1 },
  { id: 'qatar-2027', round: 23, name: { pl: 'GP Kataru', en: 'Qatar GP' }, countryCode: 'QA', circuit: 'Lusail International Circuit', city: 'Lusail', date: '2027-12-05', status: 'uncertain', officialTicketsUrl: F1 },
  { id: 'abudhabi-2027', round: 24, name: { pl: 'GP Abu Zabi', en: 'Abu Dhabi GP' }, countryCode: 'AE', circuit: 'Yas Marina', city: 'Abu Zabi', date: '2027-12-12', status: 'uncertain', officialTicketsUrl: F1 },
];
