'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { convert, getGuide, OFFERS, RACES } from '@gridtrip/shared';
import { Money, Top, useApp } from '@/components/App';
import { suggest } from '@/lib/data';

export default function Races() {
  const { t, lang, rates } = useApp();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return RACES.filter((r) => !s || [r.name.pl, r.name.en, r.city, r.circuit, getGuide(r.countryCode)?.name[lang] ?? ''].some((x) => x.toLowerCase().includes(s)));
  }, [q, lang]);

  const fromPrice = (raceId: string) => {
    const items = suggest(raceId, 'budget', rates);
    if (!items.length) return null;
    const eur = items.reduce((s, it) => {
      const o = OFFERS.find((x) => x.id === it.offerId)!;
      return s + convert(o.price, o.currency, 'EUR', rates);
    }, 0);
    return eur;
  };

  return (
    <main className="wrap">
      <Top back="/" label={`${t.step} 1 ${t.of} 4`} />
      <h1>{t.chooseRace}</h1>
      <label className="field">{t.search}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.searchPh} />
      </label>
      <div className="stack">
        {list.map((r) => {
          const p = fromPrice(r.id);
          return (
            <Link key={r.id} href={`/races/${r.id}/`} className="card">
              <div className="row">
                <div className="stack" style={{ gap: 3 }}>
                  <b style={{ fontSize: 16 }}>{r.name[lang]}</b>
                  <span className="small muted">{new Date(r.date).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', { day: 'numeric', month: 'long' })} · {r.city}</span>
                </div>
                {r.status === 'uncertain' ? <span className="tag warn">{t.uncertain}</span>
                  : p !== null ? <span className="small strong" style={{ color: 'var(--accent)' }}>{t.from} <Money amount={p} currency="EUR" /></span>
                  : <span className="small muted">{t.noPrice}</span>}
              </div>
            </Link>
          );
        })}
      </div>
      <p className="small muted">{t.uncertainNote}</p>
    </main>
  );
}
