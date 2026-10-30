'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Level, OfferType, summarizeTrip, TripItem } from '@gridtrip/shared';
import { Money, Top, useApp } from '@/components/App';
import { offers, race, suggest } from '@/lib/data';
import { save } from '@/lib/store';

export default function PackageView({ id, level }: { id: string; level: string }) {
  const { t, lang, rates } = useApp();
  const router = useRouter();
  const r = race(id);
  const lvl = (['budget', 'standard', 'premium'].includes(level) ? level : 'budget') as Level;
  const [items, setItems] = useState<TripItem[]>([]);
  const [people, setPeople] = useState(1);

  useEffect(() => { setItems(suggest(id, lvl, rates)); }, [id, lvl, rates]);
  if (!r) return <main className="wrap"><Top back="/races/" /><p>404</p></main>;

  const all = offers(id);
  const withQty = items.map((i) => ({ ...i, quantity: people }));
  const s = withQty.length ? summarizeTrip(withQty, 'EUR', rates) : null;
  const label = (o: { type: OfferType }) => t[o.type];

  const swap = (from: string, to: string) => setItems(items.map((i) => (i.offerId === from ? { ...i, offerId: to } : i)));

  const goPay = () => {
    save('draft', { raceId: id, level: lvl, items: withQty });
    router.push('/pay/');
  };

  return (
    <main className="wrap">
      <Top back={`/races/${id}/`} label={`${t.step} 3 ${t.of} 4 · ${t[lvl]}`} />
      <h1>{t.yourPackage}</h1>
      <div className="muted small">{r.name[lang]} · {new Date(r.date).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB')}</div>
      <label className="field">{t.persons}
        <select value={people} onChange={(e) => setPeople(Number(e.target.value))}>
          {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      {!s && (
        <div className="card">
          <p>{t.noOffers}</p>
          <a className="btn ghost" href={r.officialTicketsUrl} target="_blank" rel="noreferrer">{t.officialTickets}</a>
        </div>
      )}
      {s && s.items.map((line) => {
        const o = line.offer;
        const alternatives = all.filter((x) => x.id !== o.id && x.includes.join() === o.includes.join());
        return (
          <div key={o.id} className="card">
            <div className="eyebrow">{label(o)}</div>
            <div className="row"><b style={{ fontSize: 16 }}>{o.title[lang]}</b><Money amount={o.price * people} currency={o.currency} /></div>
            <div className="small muted">{o.details[lang]}{o.isEstimate ? ` · ${t.estimate}` : ''}</div>
            <div className="small muted">{t.source}: <a href={o.url} target="_blank" rel="noreferrer">{o.partner}</a> ({o.source})</div>
            {alternatives.length > 0 && (
              <label className="field">
                <span className="sr">{label(o)}</span>
                <select value={o.id} onChange={(e) => swap(o.id, e.target.value)}>
                  <option value={o.id}>{o.title[lang]}</option>
                  {alternatives.map((a) => <option key={a.id} value={a.id}>{a.title[lang]} ({t[a.level]})</option>)}
                </select>
              </label>
            )}
          </div>
        );
      })}
      {s && s.missing.length > 0 && (
        <div className="note"><b>{t.missing}: {s.missing.map((m) => t[m]).join(', ')}.</b> {t.missingHelp} <a href={r.officialTicketsUrl} target="_blank" rel="noreferrer">{t.officialTickets}</a></div>
      )}
      {s && (
        <div className="summary bottom">
          <div className="row"><span className="muted">{t.total}</span><Money amount={s.total} currency="EUR" big /></div>
          <button className="btn" onClick={goPay}>{t.toPayment}</button>
        </div>
      )}
      <Link href={`/guides/${r.countryCode}/`} className="small">{t.guide}</Link>
    </main>
  );
}
