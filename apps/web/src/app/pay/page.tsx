'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { convert, formatMoney, Level, PaymentMethod, savingsPlan, summarizeTrip, TripItem } from '@driftora/shared';
import { Money, Top, useApp } from '@/components/App';
import { createAndPay, DEMO, paymentMethods, race } from '@/lib/data';
import { load } from '@/lib/store';

const COUNTRIES = ['PL', 'DE', 'GB', 'FR', 'ES', 'IT', 'HU', 'CZ', 'US', 'CA', 'BR', 'MX', 'JP', 'SG', 'AE', 'SA', 'UA', 'KZ', 'IN', 'NG'];

export default function Pay() {
  const { t, lang, rates, currency, country, setCountry } = useApp();
  const router = useRouter();
  const [draft, setDraft] = useState<{ raceId: string; level: Level; items: TripItem[] } | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('pay_now');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { setDraft(load('draft')); }, []);
  if (!draft) return <main className="wrap"><Top back="/races/" /><p>{t.noTrip}</p></main>;

  const r = race(draft.raceId)!;
  const s = summarizeTrip(draft.items, 'EUR', rates);
  const methods = paymentMethods(country);
  const inst = methods.find((m) => m.method === 'instalments')!;
  const totalUser = convert(s.total, 'EUR', currency, rates);
  const plan = savingsPlan(totalUser, new Date().toISOString().slice(0, 10), r.date);
  const locale = lang === 'pl' ? 'pl-PL' : 'en-GB';

  const pay = async () => {
    setBusy(true); setErr('');
    try {
      const res = await createAndPay({ raceId: draft.raceId, level: draft.level, currency, items: draft.items, total: totalUser }, method, country);
      if (res.redirectUrl) window.location.href = res.redirectUrl;
      else router.push('/trip/');
    } catch {
      setErr(t.error);
    } finally {
      setBusy(false);
    }
  };

  const option = (m: PaymentMethod, title: string, text: string, disabled = false) => (
    <label className={`card radio${method === m ? ' selected' : ''}${disabled ? ' disabled' : ''}`}>
      <input type="radio" name="pay" checked={method === m} disabled={disabled} onChange={() => setMethod(m)} />
      <span className="stack" style={{ gap: 4 }}><span className="rt">{title}</span><span className="small muted">{text}</span></span>
    </label>
  );

  return (
    <main className="wrap">
      <Top back={`/races/${draft.raceId}/${draft.level}/`} label={`${t.step} 4 ${t.of} 4`} />
      <h1>{t.howPay}</h1>
      <div className="card"><div className="row"><span className="muted">{t.toPay}</span><Money amount={s.total} currency="EUR" big /></div></div>
      <label className="field">{t.country}
        <select value={country} onChange={(e) => { setCountry(e.target.value); if (method === 'instalments') setMethod('pay_now'); }}>
          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <div className="stack">
        {option('pay_now', t.payNow, t.payNowText)}
        {option('instalments', t.instalments, inst.available ? `${t.instalmentsText} (${inst.partners?.join(', ')})` : t.instalmentsNone, !inst.available)}
        {option('save_up', t.saveUp, `${t.saveUpText} ${formatMoney(plan.monthly, currency, locale)} ${t.monthly} ${plan.months} ${t.months}`)}
        {option('split', t.split, t.splitText)}
      </div>
      <p className="small muted">{t.dcc}</p>
      {DEMO && <p className="small muted">{t.testMode}</p>}
      {err && <div className="note" role="alert">{err}</div>}
      <div className="bottom">
        <button className="btn" onClick={pay} disabled={busy}>{t.pay} {formatMoney(totalUser, currency, locale)}</button>
      </div>
    </main>
  );
}
