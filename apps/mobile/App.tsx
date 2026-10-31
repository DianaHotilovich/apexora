import { BarlowCondensed_600SemiBold, BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold_Italic } from '@expo-google-fonts/barlow-condensed';
import { Barlow_400Regular, Barlow_600SemiBold } from '@expo-google-fonts/barlow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  airbnbUrl, bookingUrl, checklistFor, convert, fetchLiveRates, daysUntil, defaultStay, DICT, formatMoney, getGuide, getRace, GUIDES, hasRate,
  Lang, Level, methodsFor, nextRace, PaymentMethod, Race, RACES, Rates, RATES_SNAPSHOT, savingsPlan, searchCity, suggestTrip,
  summarizeTrip, TripItem,
} from '@gridtrip/shared';

/**
 * GridTrip mobile (Expo). Same data, logic and brand as the web app (@gridtrip/shared).
 * Brand: kerb stripes, slanted condensed headlines, the calendar as a timing tower, the trip as a paddock pass.
 * Offline: trip, checklist progress, hotel address and last exchange rates are kept in AsyncStorage.
 * With EXPO_PUBLIC_API_URL set, exchange rates are refreshed from the GridTrip API.
 */
const API = process.env.EXPO_PUBLIC_API_URL;
const C = {
  navy: '#13233F', navy2: '#1C3156', red: '#9B1B30', pink: '#F2B8C2', purple: '#6B2FA0', purpleLt: '#C39BF0', blue: '#2B4BBF',
  ground: '#EEF1F6', muted: '#5A6683', soft: '#A9B4CC', line: '#D5DBE6', sos: '#B3261E',
};
const F = { display: 'BarlowCondensed_800ExtraBold_Italic', bold: 'BarlowCondensed_700Bold', semi: 'BarlowCondensed_600SemiBold', text: 'Barlow_400Regular', textB: 'Barlow_600SemiBold' };

type Screen =
  | { name: 'home' } | { name: 'races' } | { name: 'level'; raceId: string }
  | { name: 'package'; raceId: string; level: Level } | { name: 'pay' } | { name: 'trip' }
  | { name: 'guides' } | { name: 'guide'; code: string } | { name: 'sos'; code: string } | { name: 'currency' };

interface Trip { raceId: string; level: Level; items: TripItem[]; status: 'paid' | 'scheduled' | 'payment_pending'; done: string[] }

const store = {
  async get<T>(k: string): Promise<T | null> { try { const v = await AsyncStorage.getItem(`gridtrip:${k}`); return v ? JSON.parse(v) : null; } catch { return null; } },
  async set(k: string, v: unknown) { try { await AsyncStorage.setItem(`gridtrip:${k}`, JSON.stringify(v)); } catch { /* ignore */ } },
};
const today = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [fontsLoaded] = useFonts({ BarlowCondensed_600SemiBold, BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold_Italic, Barlow_400Regular, Barlow_600SemiBold });
  const [stack, setStack] = useState<Screen[]>([{ name: 'home' }]);
  const [lang, setLang] = useState<Lang>('pl');
  const [currency, setCurrency] = useState('PLN');
  const [rates, setRates] = useState<Rates & { live?: boolean }>(RATES_SNAPSHOT);
  const [draft, setDraft] = useState<{ raceId: string; level: Level; items: TripItem[] } | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const t = DICT[lang];

  useEffect(() => {
    (async () => {
      setLang((await store.get<Lang>('lang')) ?? 'pl');
      setCurrency((await store.get<string>('currency')) ?? 'PLN');
      setTrip(await store.get<Trip>('trip'));
      const cached = await store.get<Rates>('rates');
      if (cached) setRates(cached);
      // Rates refresh on their own: API if configured, otherwise straight from the ECB feed; the last good rates stay for offline use.
      try {
        const r = API ? await (await fetch(`${API}/api/rates`)).json() : { ...(await fetchLiveRates()), live: true };
        setRates(r); store.set('rates', r);
      } catch { /* offline: keep cached */ }
    })();
  }, []);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: C.navy }} />;

  const screen = stack[stack.length - 1];
  const go = (s: Screen) => setStack([...stack, s]);
  const back = () => setStack(stack.length > 1 ? stack.slice(0, -1) : stack);
  const home = (s?: Screen) => setStack(s ? [{ name: 'home' }, s] : [{ name: 'home' }]);
  const locale = lang === 'pl' ? 'pl-PL' : 'en-GB';
  const money = (amount: number, cur: string) =>
    hasRate(rates, cur) && hasRate(rates, currency) ? formatMoney(convert(amount, cur, currency, rates), currency, locale) : formatMoney(amount, cur);
  const saveTrip = (tr: Trip) => { setTrip(tr); store.set('trip', tr); };
  const country = (r: Race) => getGuide(r.countryCode)?.name[lang] ?? r.city;
  const priceOf = (id: string) => { const it = suggestTrip(id, 'budget', rates); return it.length ? summarizeTrip(it, 'EUR', rates) : null; };
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'long' });

  const header = (label?: string, dark = false) => (
    <View style={s.top}>
      {stack.length > 1 ? <Round onPress={back} dark={dark} label={t.back} /> : <Text style={[s.logo, dark && { color: '#fff' }]}>Grid<Text style={{ color: dark ? C.pink : C.red }}>Trip</Text></Text>}
      <Text style={[s.step, { flex: 1 }, dark && { color: C.soft }]} numberOfLines={1}>{label ?? ''}</Text>
      <Chip dark={dark} onPress={() => { const l = lang === 'pl' ? 'en' : 'pl'; setLang(l); store.set('lang', l); }}>{lang.toUpperCase()}</Chip>
      <Chip dark={dark} onPress={() => { const order = ['PLN', 'EUR', 'USD', 'GBP']; const c = order[(order.indexOf(currency) + 1) % order.length]; setCurrency(c); store.set('currency', c); }}>{currency}</Chip>
    </View>
  );

  let body: ReactNode = null;
  let dark = false;

  if (screen.name === 'home') {
    const next = nextRace(today());
    const nextPrice = next ? priceOf(next.id) : null;
    const best = RACES.filter((r) => r.date >= today() && r.id !== next?.id)
      .map((r) => ({ r, p: priceOf(r.id) })).filter((x) => x.p && x.p.missing.length === 0)
      .sort((a, b) => a.p!.total - b.p!.total)[0];
    body = (
      <>
        {header()}
        <View style={s.hero}>
          <Text style={s.heroTitle}>{t.heroTitle}</Text>
          <Text style={[s.text, { color: C.soft, fontSize: 16 }]}>{t.heroText}</Text>
          {next && (
            <Pressable style={s.next} onPress={() => go({ name: 'level', raceId: next.id })} accessibilityRole="button">
              <View style={s.row}><Text style={s.label}>{t.nextGp}</Text><Text style={s.label}>{t.daysTo}</Text></View>
              <View style={s.row}><Text style={s.city}>{country(next).toUpperCase()}</Text><Text style={s.days}>{daysUntil(next.date, today())}</Text></View>
              <Text style={s.meta}>{next.circuit}, {fmtDate(next.date)}. {nextPrice ? `${t.priceFrom} ${money(nextPrice.total, 'EUR')}` : t.salesSoon}</Text>
            </Pressable>
          )}
        </View>
        {best && best.p && (
          <Pressable style={[s.level, { borderBottomColor: C.purple }]} onPress={() => go({ name: 'package', raceId: best.r.id, level: 'budget' })}>
            <Text style={[s.label, { color: C.purple }]}>{t.bestValue}</Text>
            <View style={s.row}><Text style={s.lname}>{country(best.r)}</Text><Text style={s.price}>{money(best.p.total, 'EUR')}</Text></View>
            <Text style={s.meta}>{best.r.circuit}, {fmtDate(best.r.date)}</Text>
          </Pressable>
        )}
        <Btn onPress={() => go({ name: 'races' })}>{t.chooseRace}</Btn>
        {trip && <Btn variant="ghost" onPress={() => go({ name: 'trip' })}>{t.beforeTrip}</Btn>}
        <View style={s.row}>
          <Btn variant="link" onPress={() => go({ name: 'guides' })}>{t.guidesFirst}</Btn>
          <Btn variant="link" onPress={() => go({ name: 'currency' })}>{t.converter}</Btn>
        </View>
        <Text style={[s.meta, { fontSize: 12 }]}>{t.unofficial}</Text>
      </>
    );
  } else if (screen.name === 'races') {
    const nextId = nextRace(today())?.id;
    const prices = new Map(RACES.map((r) => [r.id, priceOf(r.id)]));
    const best = Math.min(...[...prices.values()].filter((p) => p && p.missing.length === 0).map((p) => p!.total));
    body = (
      <>
        {header(`${t.step} 1 ${t.of} 4`)}
        <Text style={s.h1}>{t.chooseRace}</Text>
        <View style={s.tower}>
          <View style={s.th}><Text style={[s.thText, { width: 34 }]}>{t.round}</Text><Text style={[s.thText, { flex: 1 }]}>{t.race}</Text><Text style={s.thText}>{t.priceFrom}</Text></View>
          {RACES.map((r) => {
            const p = prices.get(r.id);
            const isBest = !!p && p.missing.length === 0 && p.total === best;
            return (
              <Pressable key={r.id} style={s.tr} onPress={() => go({ name: 'level', raceId: r.id })} accessibilityRole="button">
                <Text style={s.pos}>{r.round}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.trName}>{country(r)}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.trSub}>{fmtDate(r.date)}, {r.city}</Text>
                    {r.id === nextId && <Text style={s.nextTag}>{t.nextTag}</Text>}
                  </View>
                </View>
                {r.status === 'uncertain' ? <Text style={s.warnTag}>{t.uncertain}</Text>
                  : p ? <Text style={[s.trPrice, isBest && { color: C.purpleLt }]}>{money(p.total, 'EUR')}</Text>
                  : <Text style={s.trNone}>{t.noPrice}</Text>}
              </Pressable>
            );
          })}
        </View>
        <Text style={s.meta}>{t.uncertainNote}</Text>
      </>
    );
  } else if (screen.name === 'level') {
    const r = getRace(screen.raceId)!;
    body = (
      <>
        {header(`${t.step} 2 ${t.of} 4`)}
        <Text style={s.step}>{r.name[lang]} 2027, {r.circuit}</Text>
        <Text style={[s.h1, { fontSize: 52 }]}>{country(r).toUpperCase()}</Text>
        {r.status === 'uncertain' && <Text style={s.note}>{t.uncertainNote}</Text>}
        {(['budget', 'standard', 'premium'] as Level[]).map((lv) => {
          const items = suggestTrip(r.id, lv, rates);
          const sum = items.length ? summarizeTrip(items, 'EUR', rates) : null;
          return (
            <Pressable key={lv} style={s.level} onPress={() => go({ name: 'package', raceId: r.id, level: lv })}>
              <View style={s.row}><Text style={s.lname}>{t[lv]}</Text><Text style={s.price}>{sum ? money(sum.total, 'EUR') : t.noPrice}</Text></View>
              <Text style={s.meta}>{t[`${lv}Text` as 'budgetText']}</Text>
            </Pressable>
          );
        })}
        <Btn variant="ghost" onPress={() => Linking.openURL(r.officialTicketsUrl)}>{t.officialTickets}</Btn>
      </>
    );
  } else if (screen.name === 'package') {
    const r = getRace(screen.raceId)!;
    const items = suggestTrip(r.id, screen.level, rates);
    const sum = items.length ? summarizeTrip(items, 'EUR', rates) : null;
    body = (
      <>
        {header(`${t.step} 3 ${t.of} 4`)}
        <Text style={s.h1}>{t.yourPackage}</Text>
        {!sum && <View style={s.card}><Text style={s.text}>{t.noOffers}</Text></View>}
        {sum && (
          <>
            <LinearGradient colors={[C.purple, C.red, C.purple, C.red]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.lanyard} />
            <View style={s.pass}>
              <View style={s.holo}>
                <LinearGradient colors={[C.purple, C.blue, C.red]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }} style={StyleSheet.absoluteFill} />
                <View style={s.hole} />
                <Text style={s.holoSmall}>{t.round} {r.round}, 2027 · {t[screen.level]}</Text>
                <Text style={s.holoName}>{country(r).toUpperCase()}</Text>
              </View>
              <View style={{ padding: 16, gap: 12 }}>
                {sum.items.map(({ offer: o }) => (
                  <Pressable key={o.id} onPress={() => Linking.openURL(o.url)} style={s.passItem}>
                    <Text style={s.label}>{t[o.type]}</Text>
                    <View style={s.row}><Text style={[s.textB, { flex: 1 }]}>{o.title[lang]}</Text><Text style={s.price}>{money(o.price, o.currency)}</Text></View>
                    <Text style={s.meta}>{o.details[lang]}{o.isEstimate ? `, ${t.estimate}` : ''}. {t.source}: {o.partner} ({o.source})</Text>
                  </Pressable>
                ))}
                <View style={s.tear} />
                <View style={s.row}><Text style={s.label}>{t.total}</Text><Text style={s.total}>{money(sum.total, 'EUR')}</Text></View>
              </View>
            </View>
            {sum.missing.length > 0 && <Text style={s.note}>{t.missing}: {sum.missing.map((m) => t[m]).join(', ')}. {t.missingHelp}</Text>}
            <Btn onPress={() => { setDraft({ raceId: r.id, level: screen.level, items }); go({ name: 'pay' }); }}>{t.toPayment}</Btn>
          </>
        )}
        <StaySearch lang={lang} city={r.city} raceDate={r.date} />
      </>
    );
  } else if (screen.name === 'pay' && draft) {
    body = <PayScreen header={header} draft={draft} lang={lang} currency={currency} rates={rates} onDone={(status) => { saveTrip({ ...draft, status, done: [] }); home({ name: 'trip' }); }} />;
  } else if (screen.name === 'trip') {
    if (!trip) body = <>{header()}<Text style={s.text}>{t.noTrip}</Text></>;
    else {
      const r = getRace(trip.raceId)!;
      const list = checklistFor(r.countryCode, r.date, lang);
      const pct = trip.done.length / list.length;
      body = (
        <>
          {header()}
          {trip.status === 'paid' && <Text style={s.ok}>{t.paid}</Text>}
          {trip.status === 'scheduled' && <Text style={s.ok}>{t.scheduled}</Text>}
          {trip.status === 'payment_pending' && <Text style={s.note}>{t.pending}</Text>}
          <Text style={s.h1}>{t.beforeTrip}</Text>
          <Text style={s.meta}>{country(r)} · {daysUntil(r.date, today())} {t.daysTo} · {trip.done.length}/{list.length} {t.ready}</Text>
          <View style={s.progress}><View style={{ width: `${pct * 100}%`, overflow: 'hidden' }}><Kerb height={14} /></View></View>
          <View style={s.card}>
            {list.map((i) => {
              const on = trip.done.includes(i.id);
              return (
                <Pressable key={i.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={s.check}
                  onPress={() => saveTrip({ ...trip, done: on ? trip.done.filter((d) => d !== i.id) : [...trip.done, i.id] })}>
                  <View style={[s.box, on && { backgroundColor: C.red, borderColor: C.red }]}>{on && <Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text>}</View>
                  <Text style={[s.text, { flex: 1 }, on && { color: C.muted, textDecorationLine: 'line-through' }]}>{i.text}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={[s.row, { gap: 10 }]}>
            <View style={{ flex: 1 }}><Btn variant="ghost" onPress={() => go({ name: 'guide', code: r.countryCode })}>{t.guide}</Btn></View>
            <View style={{ flex: 1 }}><Btn variant="sos" onPress={() => go({ name: 'sos', code: r.countryCode })}>{t.sos}</Btn></View>
          </View>
        </>
      );
    }
  } else if (screen.name === 'guides') {
    body = (
      <>
        {header()}
        <Text style={s.h1}>{t.guides}</Text>
        <Text style={s.meta}>{t.guidesText}</Text>
        {[...GUIDES].sort((a, b) => a.name[lang].localeCompare(b.name[lang])).map((g) => (
          <Pressable key={g.code} style={s.card} onPress={() => go({ name: 'guide', code: g.code })}>
            <Text style={s.lname}>{g.name[lang]}</Text><Text style={s.meta}>{g.place[lang]}</Text>
          </Pressable>
        ))}
      </>
    );
  } else if (screen.name === 'guide') {
    const g = getGuide(screen.code)!;
    body = (
      <>
        {header()}
        <Text style={[s.h1, { fontSize: 52 }]}>{g.name[lang].toUpperCase()}</Text>
        <Text style={s.meta}>Grand Prix: {g.gpLabel[lang]} · {g.place[lang]}</Text>
        <View style={s.sosBox}>
          <Text style={[s.section, { color: '#8E1D17' }]}>{t.emergency}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
            {g.sos.map((n) => <Pressable key={n.number + n.label.en} onPress={() => Linking.openURL(`tel:${n.number}`)}><Text style={s.sosNum}>{n.number}</Text><Text style={s.meta}>{n.label[lang]}</Text></Pressable>)}
          </View>
        </View>
        <Text style={s.info}>{g.warning[lang]}</Text>
        {([[t.sim, g.sim[lang]], [t.moving, g.transport[lang]], [t.money, `${g.money[lang]} ${g.language[lang]}`]] as const).map(([h, p]) => (
          <View key={h} style={s.card}><Text style={s.section}>{h}</Text><Text style={s.text}>{p}</Text></View>
        ))}
        <View style={s.card}><Text style={s.section}>{t.phrases}</Text>{g.phrases.map((p) => <View key={p.local} style={s.row}><Text style={s.meta}>{p.text[lang]}</Text><Text style={s.textB}>{p.local}</Text></View>)}</View>
        <Text style={[s.meta, { fontSize: 12 }]}>{t.dataFrom} · {g.sources[lang]}</Text>
        <Btn variant="sos" onPress={() => go({ name: 'sos', code: g.code })}>{t.sos}</Btn>
      </>
    );
  } else if (screen.name === 'sos') {
    dark = true;
    body = <SosScreen header={header} code={screen.code} lang={lang} />;
  } else if (screen.name === 'currency') {
    body = <CurrencyScreen header={header} rates={rates} currency={currency} lang={lang} />;
  } else {
    body = <>{header()}</>;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: dark ? C.navy : C.ground }} edges={['top', 'left', 'right']}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Kerb />
        <ScrollView contentContainerStyle={s.wrap}>{body}</ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Kerb({ height = 10 }: { height?: number }) {
  return (
    <View style={{ flexDirection: 'row', height, overflow: 'hidden' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: 40 }, (_, i) => <View key={i} style={{ width: 24, height, backgroundColor: i % 2 ? '#fff' : C.red }} />)}
    </View>
  );
}

function StaySearch({ lang, city, raceDate }: { lang: Lang; city: string; raceDate: string }) {
  const t = DICT[lang];
  const d = defaultStay(raceDate);
  const [checkIn, setIn] = useState(d.checkIn);
  const [checkOut, setOut] = useState(d.checkOut);
  const [guests, setGuests] = useState('2');
  const [max, setMax] = useState('');
  const q = { city: searchCity(city), checkIn, checkOut, guests: Math.max(1, Number(guests) || 1), maxPerNightEur: Number(max) || undefined };
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(checkIn) && /^\d{4}-\d{2}-\d{2}$/.test(checkOut) && checkIn < checkOut;
  return (
    <View style={s.card}>
      <Text style={s.section}>{t.findStay}</Text>
      <Text style={s.meta}>{t.findStayText}</Text>
      <View style={[s.row, { gap: 8 }]}>
        <Field label={t.checkIn} value={checkIn} onChange={setIn} />
        <Field label={t.checkOut} value={checkOut} onChange={setOut} />
      </View>
      <View style={[s.row, { gap: 8 }]}>
        <Field label={t.guests} value={guests} onChange={(v) => setGuests(v.replace(/\D/g, ''))} numeric />
        <Field label={t.maxNight} value={max} onChange={(v) => setMax(v.replace(/\D/g, ''))} numeric placeholder="150" />
      </View>
      <View style={[s.row, { gap: 8 }]}>
        <View style={{ flex: 1 }}><Btn variant="dark" disabled={!valid} onPress={() => Linking.openURL(bookingUrl(q))}>Booking.com</Btn></View>
        <View style={{ flex: 1 }}><Btn variant="dark" disabled={!valid} onPress={() => Linking.openURL(airbnbUrl(q))}>Airbnb</Btn></View>
      </View>
      <Text style={[s.meta, { fontSize: 12 }]}>{t.stayNote}</Text>
    </View>
  );
}

function Field({ label, value, onChange, numeric, placeholder }: { label: string; value: string; onChange: (v: string) => void; numeric?: boolean; placeholder?: string }) {
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType={numeric ? 'number-pad' : 'default'} placeholder={placeholder} style={s.input} accessibilityLabel={label} />
    </View>
  );
}

function PayScreen({ header, draft, lang, currency, rates, onDone }: {
  header: (l?: string) => ReactNode; draft: { raceId: string; items: TripItem[] }; lang: Lang; currency: string; rates: Rates;
  onDone: (status: Trip['status']) => void;
}) {
  const t = DICT[lang];
  const [country, setCountry] = useState('PL');
  const [method, setMethod] = useState<PaymentMethod>('pay_now');
  const r = getRace(draft.raceId)!;
  const total = convert(summarizeTrip(draft.items, 'EUR', rates).total, 'EUR', currency, rates);
  const locale = lang === 'pl' ? 'pl-PL' : 'en-GB';
  const plan = savingsPlan(total, today(), r.date);
  const inst = methodsFor(country).find((m) => m.method === 'instalments')!;
  const opts: [PaymentMethod, string, string, boolean][] = [
    ['pay_now', t.payNow, t.payNowText, true],
    ['instalments', t.instalments, inst.available ? `${t.instalmentsText} (${inst.partners?.join(', ')})` : t.instalmentsNone, inst.available],
    ['save_up', t.saveUp, `${t.saveUpText} ${formatMoney(plan.monthly, currency, locale)} ${t.monthly} ${plan.months} ${t.months}`, true],
    ['split', t.split, t.splitText, true],
  ];
  return (
    <>
      {header(`${t.step} 4 ${t.of} 4`)}
      <Text style={s.h1}>{t.howPay}</Text>
      <Text style={s.label}>{t.country}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {['PL', 'DE', 'GB', 'US', 'BR', 'UA'].map((c) => <Chip key={c} active={c === country} onPress={() => { setCountry(c); setMethod('pay_now'); }}>{c}</Chip>)}
      </View>
      {opts.map(([m, title, text, ok]) => (
        <Pressable key={m} disabled={!ok} onPress={() => setMethod(m)} accessibilityRole="radio" accessibilityState={{ checked: method === m, disabled: !ok }}
          style={[s.card, method === m && { borderLeftColor: C.red }, !ok && { opacity: 0.55 }]}>
          <Text style={s.lname}>{title}</Text><Text style={s.meta}>{text}</Text>
        </Pressable>
      ))}
      <Text style={s.meta}>{t.dcc}</Text>
      <Text style={s.meta}>{t.testMode}</Text>
      <Btn onPress={() => onDone(method === 'pay_now' ? 'paid' : method === 'save_up' ? 'scheduled' : 'payment_pending')}>{`${t.pay} ${formatMoney(total, currency, locale)}`}</Btn>
    </>
  );
}

function SosScreen({ header, code, lang }: { header: (l?: string, dark?: boolean) => ReactNode; code: string; lang: Lang }) {
  const t = DICT[lang];
  const g = getGuide(code)!;
  const [hotel, setHotel] = useState('');
  useEffect(() => { store.get<string>(`hotel-${code}`).then((h) => setHotel(h ?? '')); }, [code]);
  return (
    <>
      {header(t.offline, true)}
      <Text style={[s.h1, { color: '#fff' }]}>{t.helpIn} · {g.name[lang]}</Text>
      <Pressable style={s.call} onPress={() => Linking.openURL(`tel:${g.sos[0].number}`)} accessibilityRole="button">
        <Text style={s.callNum}>{g.sos[0].number}</Text>
        <Text style={[s.textB, { color: '#fff' }]}>{t.callNow} · {g.sos[0].label[lang]}</Text>
      </Pressable>
      {g.sos.slice(1).map((n) => <Btn key={n.number + n.label.en} variant="ghost" onPress={() => Linking.openURL(`tel:${n.number}`)}>{`${n.label[lang]} ${n.number}`}</Btn>)}
      <View style={s.card}>
        <Text style={s.section}>{t.myHotel}</Text>
        <TextInput multiline value={hotel} placeholder={t.hotelPh} style={[s.input, { minHeight: 84, fontSize: 18 }]}
          onChangeText={(v) => { setHotel(v); store.set(`hotel-${code}`, v); }} />
      </View>
      <View style={[s.card, { backgroundColor: C.navy2 }]}>
        {g.phrases.map((p) => <View key={p.local} style={s.row}><Text style={[s.text, { color: C.soft }]}>{p.text[lang]}</Text><Text style={[s.textB, { color: '#fff', fontSize: 18 }]}>{p.local}</Text></View>)}
      </View>
    </>
  );
}

function CurrencyScreen({ header, rates, currency, lang }: { header: (l?: string) => ReactNode; rates: Rates & { live?: boolean }; currency: string; lang: Lang }) {
  const t = DICT[lang];
  const codes = useMemo(() => Object.keys(rates.rates).sort(), [rates]);
  const [from, setFrom] = useState('EUR');
  const [amount, setAmount] = useState('100');
  const n = Number(amount.replace(',', '.')) || 0;
  return (
    <>
      {header(t.offline)}
      <Text style={s.h1}>{t.converter}</Text>
      <View style={s.card}>
        <Text style={s.label}>{t.amountIn}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {codes.map((c) => <Chip key={c} active={c === from} onPress={() => setFrom(c)}>{c}</Chip>)}
        </View>
        <TextInput keyboardType="decimal-pad" value={amount} onChangeText={setAmount} style={[s.input, { fontSize: 24 }]} accessibilityLabel={t.amountIn} />
        <Text style={s.label}>{t.isAbout}</Text>
        <Text style={s.bigResult}>{formatMoney(convert(n, from, currency, rates), currency, lang === 'pl' ? 'pl-PL' : 'en-GB')}</Text>
        <Text style={s.meta}>{t.rateFrom}: {rates.source} · {rates.date} · {rates.live ? t.liveRate : t.savedRate}</Text>
      </View>
      <Text style={s.note}>{t.dcc}</Text>
    </>
  );
}

function Round({ onPress, dark, label }: { onPress: () => void; dark?: boolean; label: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={[s.round, dark && { backgroundColor: C.navy2 }]}>
      <Text style={{ fontSize: 22, color: dark ? '#fff' : C.navy, marginTop: -2 }}>‹</Text>
    </Pressable>
  );
}

function Chip({ children, onPress, active, dark }: { children: ReactNode; onPress?: () => void; active?: boolean; dark?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[s.chip, dark && { backgroundColor: 'transparent', borderColor: '#2A4270' }, active && { backgroundColor: C.navy, borderColor: C.navy }]}>
      <Text style={[s.chipText, (dark || active) && { color: '#fff' }]}>{children}</Text>
    </Pressable>
  );
}

/** Slanted button, like the web version: skewed shape, upright text. */
function Btn({ children, onPress, variant = 'primary', disabled }: { children: ReactNode; onPress?: () => void; variant?: 'primary' | 'ghost' | 'dark' | 'sos' | 'link'; disabled?: boolean }) {
  if (variant === 'link') {
    return <Pressable onPress={onPress} accessibilityRole="button" style={{ paddingVertical: 10 }}><Text style={s.linkText}>{children}</Text></Pressable>;
  }
  const bg = { primary: C.red, ghost: '#fff', dark: C.navy, sos: C.sos }[variant];
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }}
      style={[s.btn, { backgroundColor: bg }, disabled && { opacity: 0.5 }]}>
      <Text style={[s.btnText, variant === 'ghost' && { color: C.navy }, { transform: [{ skewX: '12deg' }] }]}>{children}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, gap: 14, flexGrow: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { fontFamily: F.display, fontSize: 28, color: C.navy },
  step: { fontFamily: F.semi, fontSize: 16, color: C.muted },
  h1: { fontFamily: F.display, fontSize: 42, lineHeight: 42, color: C.navy },
  hero: { backgroundColor: C.navy, marginHorizontal: -20, padding: 20, paddingTop: 24, gap: 14 },
  heroTitle: { fontFamily: F.display, fontSize: 58, lineHeight: 54, color: '#fff' },
  next: { backgroundColor: '#fff', padding: 16, gap: 2, borderLeftWidth: 4, borderLeftColor: C.red },
  city: { fontFamily: F.display, fontSize: 40, lineHeight: 42, color: C.navy, flexShrink: 1 },
  days: { fontFamily: F.display, fontSize: 46, lineHeight: 46, color: C.red },
  label: { fontFamily: F.semi, fontSize: 15, color: C.muted },
  meta: { fontFamily: F.text, fontSize: 14, color: C.muted, lineHeight: 20 },
  text: { fontFamily: F.text, fontSize: 16, color: C.navy, lineHeight: 22 },
  textB: { fontFamily: F.textB, fontSize: 16, color: C.navy },
  section: { fontFamily: F.bold, fontSize: 19, color: C.red },
  price: { fontFamily: F.bold, fontSize: 20, color: C.navy },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { backgroundColor: '#fff', padding: 16, gap: 8, borderLeftWidth: 4, borderLeftColor: 'transparent' },
  level: { backgroundColor: '#fff', padding: 16, gap: 4, borderBottomWidth: 5, borderBottomColor: C.navy },
  lname: { fontFamily: F.display, fontSize: 30, lineHeight: 32, color: C.navy },
  tower: { backgroundColor: C.navy, borderLeftWidth: 4, borderLeftColor: C.red },
  th: { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 },
  thText: { fontFamily: F.semi, fontSize: 14, color: '#7D89AB' },
  tr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.navy2, gap: 8 },
  pos: { width: 26, fontFamily: F.bold, fontSize: 18, color: '#7D89AB' },
  trName: { fontFamily: F.bold, fontSize: 20, color: '#fff' },
  trSub: { fontFamily: F.text, fontSize: 13, color: '#8E98B8' },
  trPrice: { fontFamily: F.bold, fontSize: 18, color: '#fff' },
  trNone: { fontFamily: F.semi, fontSize: 15, color: '#6F7A9B' },
  nextTag: { fontFamily: F.semi, fontSize: 13, color: '#fff', backgroundColor: C.red, paddingHorizontal: 6 },
  warnTag: { fontFamily: F.semi, fontSize: 14, color: '#FFCF7A', backgroundColor: '#3A2A10', paddingHorizontal: 8, paddingVertical: 2 },
  lanyard: { width: 30, height: 40, alignSelf: 'center', marginBottom: -24, zIndex: 1 },
  pass: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', elevation: 4, shadowColor: '#2B195A', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 12 } },
  holo: { minHeight: 110, paddingHorizontal: 18, paddingTop: 34, paddingBottom: 14, justifyContent: 'flex-end', overflow: 'hidden' },
  hole: { position: 'absolute', alignSelf: 'center', left: '50%', marginLeft: -28, top: 12, width: 56, height: 12, borderRadius: 8, backgroundColor: C.ground },
  holoSmall: { fontFamily: F.semi, fontSize: 16, color: '#fff' },
  holoName: { fontFamily: F.display, fontSize: 40, lineHeight: 42, color: '#fff' },
  passItem: { gap: 2, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E6E9F2' },
  tear: { borderTopWidth: 2, borderStyle: 'dashed', borderTopColor: '#CDD3E3', marginHorizontal: -16 },
  total: { fontFamily: F.display, fontSize: 34, color: C.red },
  btn: { minHeight: 56, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, transform: [{ skewX: '-12deg' }], marginHorizontal: 6 },
  btnText: { fontFamily: F.display, fontSize: 22, color: '#fff' },
  linkText: { fontFamily: F.display, fontSize: 19, color: C.red },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  chip: { minHeight: 40, minWidth: 44, borderRadius: 20, paddingHorizontal: 12, borderWidth: 1, borderColor: C.line, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: F.textB, fontSize: 14, color: C.navy },
  note: { fontFamily: F.text, backgroundColor: '#FFF1D6', color: '#5A3500', padding: 12, borderLeftWidth: 4, borderLeftColor: '#E0A43A' },
  ok: { fontFamily: F.textB, backgroundColor: '#DCF4E7', color: '#1D5C3A', padding: 12, borderLeftWidth: 4, borderLeftColor: '#2FBF7A' },
  info: { fontFamily: F.textB, backgroundColor: '#E6ECF8', color: C.navy, padding: 12, borderLeftWidth: 4, borderLeftColor: C.blue },
  progress: { height: 14, backgroundColor: '#DFE4EE', overflow: 'hidden' },
  check: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 46, borderBottomWidth: 1, borderBottomColor: '#E6E9F2' },
  box: { width: 24, height: 24, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  sosBox: { backgroundColor: '#FDECEC', padding: 14, gap: 8, borderLeftWidth: 4, borderLeftColor: C.sos },
  sosNum: { fontFamily: F.display, fontSize: 34, color: '#8E1D17' },
  call: { height: 150, backgroundColor: C.sos, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: '-8deg' }], marginHorizontal: 8 },
  callNum: { fontFamily: F.display, fontSize: 64, color: '#fff', transform: [{ skewX: '8deg' }] },
  input: { fontFamily: F.text, borderWidth: 1, borderColor: C.line, borderBottomWidth: 3, borderBottomColor: C.navy, padding: 12, backgroundColor: '#fff', color: C.navy, fontSize: 16 },
  bigResult: { fontFamily: F.display, fontSize: 52, color: C.red },
});
