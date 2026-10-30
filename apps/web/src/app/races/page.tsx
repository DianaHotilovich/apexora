'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { getGuide, RACES, summarizeTrip } from '@gridtrip/shared';
import { Money, Top, useApp } from '@/components/App';
import { suggest } from '@/lib/data';

/** The calendar as a timing tower: round, race, price. Purple marks the cheapest package, as purple marks the fastest lap in F1. */
export default function Races() {
  const { t, lang, rates } = useApp();
  const [q, setQ] = useState('');

  const prices = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of RACES) {
      const items = suggest(r.id, 'budget', rates);
      if (items.length) m.set(r.id, summarizeTrip(items, 'EUR', rates).total);
    }
    return m;
  }, [rates]);
  const best = Math.min(...prices.values());

  const list = RACES.filter((r) => {
    const s = q.trim().toLowerCase();
    return !s || [r.name.pl, r.name.en, r.city, r.circuit, getGuide(r.countryCode)?.name[lang] ?? ''].some((x) => x.toLowerCase().includes(s));
  });
  const fmt = (d: string) => new Date(d).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', { day: 'numeric', month: 'short' });

  return (
    <main className="wrap">
      <Top back="/" label={`${t.step} 1 ${t.of} 4`} />
      <h1>{t.chooseRace}</h1>
      <label className="field">{t.search}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.searchPh} />
      </label>
      <div className="tower" role="list">
        <div className="th" aria-hidden="true"><span>{t.round}</span><span>{t.race}</span><span>{t.priceFrom}</span></div>
        {list.map((r) => {
          const p = prices.get(r.id);
          return (
            <Link key={r.id} href={`/races/${r.id}/`} className="tr" role="listitem">
              <span className="pos">{r.round}</span>
              <span>
                <span className="name">{getGuide(r.countryCode)?.name[lang] ?? r.name[lang]}</span>
                <span className="sub" style={{ display: 'block' }}>{fmt(r.date)}, {r.city}</span>
              </span>
              {r.status === 'uncertain' ? <span className="tag warn">{t.uncertain}</span>
                : p !== undefined ? <span className={`price${p === best ? ' best' : ''}`}><Money amount={p} currency="EUR" /></span>
                : <span className="price none">{t.noPrice}</span>}
            </Link>
          );
        })}
      </div>
      <div className="legend"><span className="best">{t.cheapest}</span></div>
      <p className="small muted">{t.uncertainNote}</p>
    </main>
  );
}
