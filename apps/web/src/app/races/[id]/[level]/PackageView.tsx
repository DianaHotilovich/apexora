'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getGuide, Level, summarizeTrip, TripItem } from '@driftora/shared';
import { Money, Top, useApp } from '@/components/App';
import { offers, race, suggest } from '@/lib/data';
import { StaySearch } from '@/components/StaySearch';
import { save } from '@/lib/store';

/** The package is shown as a paddock pass: the trip already looks like the thing you will hold at the gate. */
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
  const swap = (from: string, to: string) => setItems(items.map((i) => (i.offerId === from ? { ...i, offerId: to } : i)));
  const dates = new Date(r.date).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const goPay = () => {
    save('draft', { raceId: id, level: lvl, items: withQty });
    router.push('/pay/');
  };

  return (
    <main className="wrap">
      <Top back={`/races/${id}/`} label={`${t.step} 3 ${t.of} 4`} />
      <h1>{t.yourPackage}</h1>
      {!s && (
        <>
          <div className="card">
            <p>{t.noOffers}</p>
            <a className="btn ghost" href={r.officialTicketsUrl} target="_blank" rel="noreferrer">{t.officialTickets}</a>
          </div>
          <StaySearch city={r.city} raceDate={r.date} guests={people} />
        </>
      )}
      {s && (
        <>
          <div className="lanyard" aria-hidden="true" />
          <article className="pass">
            <div className="holo">
              <span className="round-no">{t.round} {r.round}, 2027 · {t[lvl]}</span>
              <span className="pname">{getGuide(r.countryCode)?.name[lang] ?? r.city}</span>
              <span className="small">{r.circuit}, {dates}</span>
            </div>
            <div className="pbody">
              {s.items.map(({ offer: o }) => {
                const alternatives = all.filter((x) => x.id !== o.id && x.includes.join() === o.includes.join());
                return (
                  <div key={o.id} className="item">
                    <span className="label">{t[o.type]}</span>
                    <b>{o.title[lang]}</b>
                    <Money amount={o.price * people} currency={o.currency} />
                    <span className="meta">{o.details[lang]}{o.isEstimate ? `, ${t.estimate}` : ''}. {t.source}: <a href={o.url} target="_blank" rel="noreferrer">{o.partner}</a> ({o.source})</span>
                    {alternatives.length > 0 && (
                      <select aria-label={t[o.type]} value={o.id} onChange={(e) => swap(o.id, e.target.value)}>
                        <option value={o.id}>{o.title[lang]}</option>
                        {alternatives.map((a) => <option key={a.id} value={a.id}>{a.title[lang]} ({t[a.level]})</option>)}
                      </select>
                    )}
                  </div>
                );
              })}
              <label className="field">{t.persons}
                <select value={people} onChange={(e) => setPeople(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <div className="tear" />
              <div className="total"><span className="label">{t.total}</span><Money amount={s.total} currency="EUR" big /></div>
            </div>
          </article>
          {s.missing.length > 0 && (
            <div className="note"><b>{t.missing}: {s.missing.map((m) => t[m]).join(', ')}.</b> {t.missingHelp} <a href={r.officialTicketsUrl} target="_blank" rel="noreferrer">{t.officialTickets}</a></div>
          )}
          <StaySearch city={r.city} raceDate={r.date} guests={people} />
          <div className="bottom">
            <button className="btn" onClick={goPay}>{t.toPayment}</button>
            <Link href={`/guides/${r.countryCode}/`} className="btn link">{t.guide}</Link>
          </div>
        </>
      )}
    </main>
  );
}
