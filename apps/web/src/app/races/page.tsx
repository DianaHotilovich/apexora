'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getGuide, nextRace, RACES, summarizeTrip } from '@driftora/shared';
import { Money, Top, useApp } from '@/components/App';
import { suggest } from '@/lib/data';

/** The calendar as a timing tower: round, race, price. Purple marks the cheapest package, as purple marks the fastest lap in F1. */
export default function Races() {
  const { t, lang, rates } = useApp();
  const [q, setQ] = useState('');
  const [nextId, setNextId] = useState<string | null>(null);
  useEffect(() => { setNextId(nextRace(new Date().toISOString().slice(0, 10))?.id ?? null); }, []);

  const prices = useMemo(() => {
    const m = new Map<string, { total: number; complete: boolean }>();
    for (const r of RACES) {
      const items = suggest(r.id, 'budget', rates);
      if (items.length) { const s = summarizeTrip(items, 'EUR', rates); m.set(r.id, { total: s.total, complete: s.missing.length === 0 }); }
    }
    return m;
  }, [rates]);
  // Purple only for a complete package (ticket + stay + travel), never for a lone ticket.
  const best = Math.min(...[...prices.values()].filter((p) => p.complete).map((p) => p.total));

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
                <span className="sub" style={{ display: 'block' }}>{fmt(r.date)}, {r.city}{r.id === nextId && <span className="tag next-tag">{t.nextTag}</span>}</span>
              </span>
              {r.status === 'uncertain' ? <span className="tag warn">{t.uncertain}</span>
                : p !== undefined ? <span className={`price${p.complete && p.total === best ? ' best' : ''}`}><Money amount={p.total} currency="EUR" /></span>
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
