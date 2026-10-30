import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  checklistFor, convert, daysUntil, DICT, formatMoney, getGuide, getRace, GUIDES, hasRate, Lang, Level,
  methodsFor, PaymentMethod, RACES, Rates, RATES_SNAPSHOT, savingsPlan, suggestTrip, summarizeTrip, TripItem,
} from '@gridtrip/shared';

/**
 * GridTrip mobile (Expo). Same data and logic as the web app (@gridtrip/shared).
 * Offline: the trip, checklist progress, hotel address and last exchange rates are kept in AsyncStorage,
 * so the checklist, guide, SOS screen and converter work without internet at the circuit.
 * With EXPO_PUBLIC_API_URL set, exchange rates are refreshed from the GridTrip API.
 */
const API = process.env.EXPO_PUBLIC_API_URL;
const C = { ink: '#12172B', ink2: '#1E2847', ground: '#F5F6FA', accent: '#8C1C3A', pink: '#E8A3B5', muted: '#5B6275', soft: '#C4CAE0', red: '#B3261E', line: '#D5D9E6' };

type Screen =
  | { name: 'home' } | { name: 'races' } | { name: 'level'; raceId: string }
  | { name: 'package'; raceId: string; level: Level } | { name: 'pay' } | { name: 'trip' }
  | { name: 'guides' } | { name: 'guide'; code: string } | { name: 'sos'; code: string } | { name: 'currency' };

interface Trip { raceId: string; level: Level; items: TripItem[]; status: 'paid' | 'scheduled' | 'payment_pending'; done: string[] }

const store = {
  async get<T>(k: string): Promise<T | null> { try { const v = await AsyncStorage.getItem(`gridtrip:${k}`); return v ? JSON.parse(v) : null; } catch { return null; } },
  async set(k: string, v: unknown) { try { await AsyncStorage.setItem(`gridtrip:${k}`, JSON.stringify(v)); } catch { /* ignore */ } },
};

export default function App() {
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
      if (API) {
        try {
          const r = await (await fetch(`${API}/api/rates`)).json();
          setRates(r); store.set('rates', r);
        } catch { /* offline: keep cached */ }
      }
    })();
  }, []);

  const screen = stack[stack.length - 1];
  const go = (s: Screen) => setStack([...stack, s]);
  const back = () => setStack(stack.length > 1 ? stack.slice(0, -1) : stack);
  const home = (s?: Screen) => setStack(s ? [{ name: 'home' }, s] : [{ name: 'home' }]);
  const money = (amount: number, cur: string) =>
    hasRate(rates, cur) && hasRate(rates, currency) ? formatMoney(convert(amount, cur, currency, rates), currency, lang === 'pl' ? 'pl-PL' : 'en-GB') : formatMoney(amount, cur);
  const saveTrip = (tr: Trip) => { setTrip(tr); store.set('trip', tr); };

  const header = (title?: string) => (
    <View style={s.top}>
      {stack.length > 1 ? <Btn small ghost onPress={back}>{t.back}</Btn> : <Text style={s.logo}>Grid<Text style={{ color: C.pink }}>Trip</Text></Text>}
      {title ? <Text style={[s.muted, { flex: 1, textAlign: 'center' }]} numberOfLines={1}>{title}</Text> : <View style={{ flex: 1 }} />}
      <Btn small ghost onPress={() => { const l = lang === 'pl' ? 'en' : 'pl'; setLang(l); store.set('lang', l); }}>{lang.toUpperCase()}</Btn>
      <Btn small ghost onPress={() => { const order = ['PLN', 'EUR', 'USD', 'GBP']; const c = order[(order.indexOf(currency) + 1) % order.length]; setCurrency(c); store.set('currency', c); }}>{currency}</Btn>
    </View>
  );

  let body: ReactNode = null;
  let dark = false;

  if (screen.name === 'home') {
    dark = true;
    body = (
      <>
        {header()}
        <Text style={s.eyebrow}>{t.season}</Text>
        <Text style={[s.h1, { color: '#fff', fontSize: 36 }]}>{t.heroTitle}</Text>
        <Text style={{ color: C.soft, fontSize: 16 }}>{t.heroText}</Text>
        <View style={{ height: 24 }} />
        <Btn onPress={() => go({ name: 'races' })}>{t.chooseRace}</Btn>
        {trip && <Btn ghost onPress={() => go({ name: 'trip' })}>{t.beforeTrip}</Btn>}
        <Btn link onPress={() => go({ name: 'guides' })}>{t.guidesFirst}</Btn>
        <Btn link onPress={() => go({ name: 'currency' })}>{t.converter}</Btn>
      </>
    );
  } else if (screen.name === 'races') {
    body = (
      <>
        {header(`${t.step} 1 ${t.of} 4`)}
        <Text style={s.h1}>{t.chooseRace}</Text>
        {RACES.map((r) => (
          <Card key={r.id} onPress={() => go({ name: 'level', raceId: r.id })}>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.b}>{r.name[lang]}</Text>
                <Text style={s.muted}>{r.date} · {r.city}</Text>
              </View>
              {r.status === 'uncertain' && <Text style={s.warn}>{t.uncertain}</Text>}
            </View>
          </Card>
        ))}
      </>
    );
  } else if (screen.name === 'level') {
    const r = getRace(screen.raceId)!;
    body = (
      <>
        {header(r.name[lang])}
        <Text style={s.h1}>{t.howTravel}</Text>
        {(['budget', 'standard', 'premium'] as Level[]).map((lv) => {
          const items = suggestTrip(r.id, lv, rates);
          const sum = items.length ? summarizeTrip(items, 'EUR', rates) : null;
          return (
            <Card key={lv} onPress={() => go({ name: 'package', raceId: r.id, level: lv })}>
              <View style={s.row}><Text style={[s.b, { fontSize: 19 }]}>{t[lv]}</Text><Text style={s.price}>{sum ? money(sum.total, 'EUR') : t.noPrice}</Text></View>
              <Text style={s.muted}>{t[`${lv}Text` as 'budgetText']}</Text>
            </Card>
          );
        })}
        <Btn ghost onPress={() => Linking.openURL(r.officialTicketsUrl)}>{t.officialTickets}</Btn>
      </>
    );
  } else if (screen.name === 'package') {
    const r = getRace(screen.raceId)!;
    const items = suggestTrip(r.id, screen.level, rates);
    const sum = items.length ? summarizeTrip(items, 'EUR', rates) : null;
    body = (
      <>
        {header(`${t.step} 3 ${t.of} 4 · ${t[screen.level]}`)}
        <Text style={s.h1}>{t.yourPackage}</Text>
        {!sum && <Card><Text>{t.noOffers}</Text></Card>}
        {sum?.items.map(({ offer: o }) => (
          <Card key={o.id} onPress={() => Linking.openURL(o.url)}>
            <Text style={s.eyebrowDark}>{t[o.type]}</Text>
            <View style={s.row}><Text style={[s.b, { flex: 1 }]}>{o.title[lang]}</Text><Text style={s.price}>{money(o.price, o.currency)}</Text></View>
            <Text style={s.muted}>{o.details[lang]}{o.isEstimate ? ` · ${t.estimate}` : ''}</Text>
            <Text style={s.muted}>{t.source}: {o.partner} ({o.source})</Text>
          </Card>
        ))}
        {sum && sum.missing.length > 0 && <Text style={s.note}>{t.missing}: {sum.missing.map((m) => t[m]).join(', ')}. {t.missingHelp}</Text>}
        {sum && (
          <View style={s.summary}>
            <View style={s.row}><Text style={{ color: C.soft }}>{t.total}</Text><Text style={[s.price, { color: '#fff', fontSize: 24 }]}>{money(sum.total, 'EUR')}</Text></View>
            <Btn onPress={() => { setDraft({ raceId: r.id, level: screen.level, items }); go({ name: 'pay' }); }}>{t.toPayment}</Btn>
          </View>
        )}
      </>
    );
  } else if (screen.name === 'pay' && draft) {
    body = <PayScreen header={header} draft={draft} lang={lang} currency={currency} rates={rates} onDone={(status) => { saveTrip({ ...draft, status, done: [] }); home({ name: 'trip' }); }} />;
  } else if (screen.name === 'trip') {
    if (!trip) body = <>{header()}<Text>{t.noTrip}</Text></>;
    else {
      const r = getRace(trip.raceId)!;
      const list = checklistFor(r.countryCode, r.date, lang);
      body = (
        <>
          {header()}
          {trip.status === 'paid' && <Text style={s.ok}>{t.paid}</Text>}
          {trip.status === 'scheduled' && <Text style={s.ok}>{t.scheduled}</Text>}
          {trip.status === 'payment_pending' && <Text style={s.note}>{t.pending}</Text>}
          <Text style={s.h1}>{t.beforeTrip}</Text>
          <Text style={s.muted}>{r.name[lang]} · {daysUntil(r.date, new Date().toISOString().slice(0, 10))} {t.daysTo} · {trip.done.length}/{list.length} {t.ready}</Text>
          <Card>
            {list.map((i) => {
              const on = trip.done.includes(i.id);
              return (
                <Pressable key={i.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={s.check}
                  onPress={() => saveTrip({ ...trip, done: on ? trip.done.filter((d) => d !== i.id) : [...trip.done, i.id] })}>
                  <View style={[s.box, on && { backgroundColor: C.accent, borderColor: C.accent }]}>{on && <Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text>}</View>
                  <Text style={{ flex: 1, fontSize: 15 }}>{i.text}</Text>
                </Pressable>
              );
            })}
          </Card>
          <View style={s.row}>
            <View style={{ flex: 1 }}><Btn ghost onPress={() => go({ name: 'guide', code: r.countryCode })}>{t.guide}</Btn></View>
            <View style={{ width: 10 }} />
            <View style={{ flex: 1 }}><Btn red onPress={() => go({ name: 'sos', code: r.countryCode })}>{t.sos}</Btn></View>
          </View>
        </>
      );
    }
  } else if (screen.name === 'guides') {
    body = (
      <>
        {header()}
        <Text style={s.h1}>{t.guides}</Text>
        <Text style={s.muted}>{t.guidesText}</Text>
        {[...GUIDES].sort((a, b) => a.name[lang].localeCompare(b.name[lang])).map((g) => (
          <Card key={g.code} onPress={() => go({ name: 'guide', code: g.code })}><Text style={s.b}>{g.name[lang]}</Text><Text style={s.muted}>{g.place[lang]}</Text></Card>
        ))}
      </>
    );
  } else if (screen.name === 'guide') {
    const g = getGuide(screen.code)!;
    body = (
      <>
        {header()}
        <Text style={s.h1}>{g.name[lang]}</Text>
        <Text style={s.muted}>Grand Prix: {g.gpLabel[lang]} · {g.place[lang]}</Text>
        <View style={s.sos}>
          <Text style={{ color: '#8E1D17', fontWeight: '700', fontSize: 12 }}>{t.emergency.toUpperCase()}</Text>
          <View style={[s.row, { flexWrap: 'wrap', justifyContent: 'flex-start', gap: 18 }]}>
            {g.sos.map((n) => <Pressable key={n.number + n.label.en} onPress={() => Linking.openURL(`tel:${n.number}`)}><Text style={{ fontSize: 24, fontWeight: '800', color: '#8E1D17' }}>{n.number}</Text><Text style={{ fontSize: 12 }}>{n.label[lang]}</Text></Pressable>)}
          </View>
        </View>
        <Text style={s.info}>{g.warning[lang]}</Text>
        <Card><Text style={s.eyebrowDark}>{t.sim}</Text><Text>{g.sim[lang]}</Text></Card>
        <Card><Text style={s.eyebrowDark}>{t.moving}</Text><Text>{g.transport[lang]}</Text></Card>
        <Card><Text style={s.eyebrowDark}>{t.money}</Text><Text>{g.money[lang]} {g.language[lang]}</Text></Card>
        <Card><Text style={s.eyebrowDark}>{t.phrases}</Text>{g.phrases.map((p) => <View key={p.local} style={s.row}><Text style={s.muted}>{p.text[lang]}</Text><Text style={s.b}>{p.local}</Text></View>)}</Card>
        <Text style={[s.muted, { fontSize: 12 }]}>{t.dataFrom} · {g.sources[lang]}</Text>
        <Btn red onPress={() => go({ name: 'sos', code: g.code })}>{t.sos}</Btn>
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
      <SafeAreaView style={{ flex: 1, backgroundColor: dark ? C.ink : C.ground }}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <ScrollView contentContainerStyle={s.wrap}>{body}</ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function PayScreen({ header, draft, lang, currency, rates, onDone }: {
  header: (t?: string) => ReactNode; draft: { raceId: string; items: TripItem[] }; lang: Lang; currency: string; rates: Rates;
  onDone: (status: Trip['status']) => void;
}) {
  const t = DICT[lang];
  const [country, setCountry] = useState('PL');
  const [method, setMethod] = useState<PaymentMethod>('pay_now');
  const r = getRace(draft.raceId)!;
  const total = convert(summarizeTrip(draft.items, 'EUR', rates).total, 'EUR', currency, rates);
  const locale = lang === 'pl' ? 'pl-PL' : 'en-GB';
  const plan = savingsPlan(total, new Date().toISOString().slice(0, 10), r.date);
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
      <Text style={s.muted}>{t.country}</Text>
      <View style={[s.row, { flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8 }]}>
        {['PL', 'DE', 'GB', 'US', 'BR', 'UA'].map((c) => <Btn key={c} small ghost={c !== country} onPress={() => { setCountry(c); setMethod('pay_now'); }}>{c}</Btn>)}
      </View>
      {opts.map(([m, title, text, ok]) => (
        <Card key={m} selected={method === m} disabled={!ok} onPress={ok ? () => setMethod(m) : undefined}>
          <Text style={s.b}>{title}</Text><Text style={s.muted}>{text}</Text>
        </Card>
      ))}
      <Text style={s.muted}>{t.dcc}</Text>
      <Text style={s.muted}>{t.testMode}</Text>
      <Btn onPress={() => onDone(method === 'pay_now' ? 'paid' : method === 'save_up' ? 'scheduled' : 'payment_pending')}>{`${t.pay} ${formatMoney(total, currency, locale)}`}</Btn>
    </>
  );
}

function SosScreen({ header, code, lang }: { header: (t?: string) => ReactNode; code: string; lang: Lang }) {
  const t = DICT[lang];
  const g = getGuide(code)!;
  const [hotel, setHotel] = useState('');
  useEffect(() => { store.get<string>(`hotel-${code}`).then((h) => setHotel(h ?? '')); }, [code]);
  return (
    <>
      {header(t.offline)}
      <Text style={[s.h1, { color: '#fff' }]}>{t.helpIn} · {g.name[lang]}</Text>
      <Pressable style={s.call} onPress={() => Linking.openURL(`tel:${g.sos[0].number}`)} accessibilityRole="button">
        <Text style={{ color: '#fff', fontSize: 44, fontWeight: '800' }}>{g.sos[0].number}</Text>
        <Text style={{ color: '#fff', fontWeight: '600' }}>{t.callNow} · {g.sos[0].label[lang]}</Text>
      </Pressable>
      {g.sos.slice(1).map((n) => <Btn key={n.number + n.label.en} ghost onPress={() => Linking.openURL(`tel:${n.number}`)}>{`${n.label[lang]} ${n.number}`}</Btn>)}
      <Card>
        <Text style={s.eyebrowDark}>{t.myHotel}</Text>
        <TextInput multiline value={hotel} placeholder={t.hotelPh} style={[s.input, { minHeight: 80, fontSize: 18 }]}
          onChangeText={(v) => { setHotel(v); store.set(`hotel-${code}`, v); }} />
      </Card>
      <View style={[s.card, { backgroundColor: C.ink2 }]}>
        {g.phrases.map((p) => <View key={p.local} style={s.row}><Text style={{ color: C.soft }}>{p.text[lang]}</Text><Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>{p.local}</Text></View>)}
      </View>
    </>
  );
}

function CurrencyScreen({ header, rates, currency, lang }: { header: (t?: string) => ReactNode; rates: Rates & { live?: boolean }; currency: string; lang: Lang }) {
  const t = DICT[lang];
  const codes = useMemo(() => Object.keys(rates.rates).sort(), [rates]);
  const [from, setFrom] = useState('EUR');
  const [amount, setAmount] = useState('100');
  const n = Number(amount.replace(',', '.')) || 0;
  return (
    <>
      {header(t.offline)}
      <Text style={s.h1}>{t.converter}</Text>
      <Card>
        <Text style={s.muted}>{t.amountIn}</Text>
        <View style={[s.row, { flexWrap: 'wrap', justifyContent: 'flex-start', gap: 6 }]}>
          {codes.map((c) => <Btn key={c} small ghost={c !== from} onPress={() => setFrom(c)}>{c}</Btn>)}
        </View>
        <TextInput keyboardType="decimal-pad" value={amount} onChangeText={setAmount} style={[s.input, { fontSize: 24, fontWeight: '700' }]} accessibilityLabel={t.amountIn} />
        <Text style={s.muted}>{t.isAbout}</Text>
        <Text style={{ fontSize: 34, fontWeight: '800', color: C.accent }}>{formatMoney(convert(n, from, currency, rates), currency, lang === 'pl' ? 'pl-PL' : 'en-GB')}</Text>
        <Text style={s.muted}>{t.rateFrom}: {rates.source} · {rates.date} · {rates.live ? t.liveRate : t.savedRate}</Text>
      </Card>
      <Text style={s.note}>{t.dcc}</Text>
    </>
  );
}

function Card({ children, onPress, selected, disabled }: { children: ReactNode; onPress?: () => void; selected?: boolean; disabled?: boolean }) {
  const style = [s.card, selected && { borderColor: C.accent }, disabled && { opacity: 0.55 }];
  if (!onPress && !disabled) return <View style={style}>{children}</View>;
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityState={{ disabled, selected }} style={style}>
      {children}
    </Pressable>
  );
}

function Btn({ children, onPress, ghost, red, link, small }: { children: ReactNode; onPress?: () => void; ghost?: boolean; red?: boolean; link?: boolean; small?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={[s.btn, small && s.btnSmall, ghost && s.btnGhost, red && { backgroundColor: C.red }, link && { backgroundColor: 'transparent' }]}>
      <Text style={[s.btnText, small && { fontSize: 14 }, ghost && { color: C.ink }, link && { color: C.pink }]}>{children}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, gap: 12, flexGrow: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  logo: { color: '#fff', fontWeight: '800', fontSize: 20 },
  h1: { fontSize: 28, fontWeight: '800', color: C.ink },
  eyebrow: { color: C.pink, fontWeight: '700', letterSpacing: 1.2, fontSize: 12, marginTop: 32 },
  eyebrowDark: { color: C.accent, fontWeight: '700', letterSpacing: 1.2, fontSize: 12 },
  muted: { color: C.muted, fontSize: 13 },
  b: { fontWeight: '700', fontSize: 16, color: C.ink },
  price: { fontWeight: '700', color: C.accent },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 6, borderWidth: 2, borderColor: 'transparent' },
  btn: { minHeight: 56, borderRadius: 16, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  btnSmall: { minHeight: 44, borderRadius: 22, paddingHorizontal: 12 },
  btnGhost: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.line },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  warn: { backgroundColor: '#FFF1D6', color: '#8A4B00', fontWeight: '700', fontSize: 12, padding: 6, borderRadius: 10 },
  note: { backgroundColor: '#FFF1D6', color: '#5A3500', padding: 12, borderRadius: 14 },
  ok: { backgroundColor: '#DDF3E6', color: '#1F5E3B', padding: 12, borderRadius: 14, fontWeight: '600' },
  info: { backgroundColor: '#EAF0FA', padding: 12, borderRadius: 14, fontWeight: '600' },
  summary: { backgroundColor: C.ink, borderRadius: 16, padding: 16, gap: 12 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  sos: { backgroundColor: '#FDECEC', borderRadius: 16, padding: 14, gap: 8, borderWidth: 1, borderColor: '#E5A3A0' },
  call: { height: 140, borderRadius: 28, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, backgroundColor: '#fff', color: C.ink },
});
