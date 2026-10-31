'use client';

import Link from 'next/link';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { convert, formatMoney, hasRate, Lang, Rates, RATES_SNAPSHOT, USER_CURRENCIES } from '@apexora/shared';
import { DICT, Dict } from '@/lib/i18n';
import { rates as loadRates } from '@/lib/data';
import { load, save } from '@/lib/store';

interface Ctx {
  lang: Lang; setLang: (l: Lang) => void;
  currency: string; setCurrency: (c: string) => void;
  country: string; setCountry: (c: string) => void;
  rates: Rates & { live: boolean };
  t: Dict;
}

const AppCtx = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp outside AppProvider');
  return c;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('pl');
  const [currency, setCurrencyState] = useState('PLN');
  const [country, setCountryState] = useState('PL');
  const [rates, setRates] = useState<Rates & { live: boolean }>({ ...RATES_SNAPSHOT, live: false });

  useEffect(() => {
    setLangState(load<Lang>('lang') ?? (navigator.language.startsWith('pl') ? 'pl' : 'en'));
    setCurrencyState(load<string>('currency') ?? 'PLN');
    setCountryState(load<string>('country') ?? 'PL');
    loadRates().then(setRates);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/sw.js`).catch(() => undefined);
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const value: Ctx = {
    lang, currency, country, rates, t: DICT[lang],
    setLang: (l) => { setLangState(l); save('lang', l); },
    setCurrency: (c) => { setCurrencyState(c); save('currency', c); },
    setCountry: (c) => { setCountryState(c); save('country', c); },
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

/** Price in the user's currency with the EUR equivalent underneath. */
export function Money({ amount, currency, big }: { amount: number; currency: string; big?: boolean }) {
  const { currency: user, rates, lang } = useApp();
  const locale = lang === 'pl' ? 'pl-PL' : 'en-GB';
  if (!hasRate(rates, currency) || !hasRate(rates, user)) {
    return <span className={big ? 'money big' : 'money'}>{formatMoney(amount, currency, locale)}</span>;
  }
  const inUser = convert(amount, currency, user, rates);
  const second = user === 'EUR' ? (currency !== 'EUR' ? formatMoney(amount, currency, locale) : null) : formatMoney(convert(amount, currency, 'EUR', rates), 'EUR', locale);
  return (
    <span className={big ? 'money big' : 'money'}>
      <b>{formatMoney(inUser, user, locale)}</b>
      {second && <small>≈ {second}</small>}
    </span>
  );
}

export function Settings() {
  const { lang, setLang, currency, setCurrency } = useApp();
  return (
    <div className="settings">
      <label className="sr" htmlFor="lang">Language</label>
      <select id="lang" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
        <option value="pl">PL</option><option value="en">EN</option>
      </select>
      <label className="sr" htmlFor="cur">Currency</label>
      <select id="cur" value={currency} onChange={(e) => setCurrency(e.target.value)}>
        {USER_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );
}

export function Top({ back, label }: { back?: string; label?: string }) {
  const { t } = useApp();
  return (
    <div className="top">
      {back ? (
        <Link href={back} className="round" aria-label={t.back}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
      ) : (
        <Link href="/" className="logo">Apex<span>ora</span></Link>
      )}
      {label && <div className="muted small strong">{label}</div>}
      <Settings />
    </div>
  );
}

/** Required by the F1 brand guidelines for unofficial sites: a footer disclaimer on every page. */
export function Disclaimer() {
  const { t } = useApp();
  return <footer className="disclaimer">{t.unofficial}</footer>;
}
