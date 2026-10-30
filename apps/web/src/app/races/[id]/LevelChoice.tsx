'use client';

import Link from 'next/link';
import { Level, summarizeTrip } from '@gridtrip/shared';
import { Money, Top, useApp } from '@/components/App';
import { race, suggest } from '@/lib/data';

const LEVELS: Level[] = ['budget', 'standard', 'premium'];

export default function LevelChoice({ id }: { id: string }) {
  const { t, lang, rates } = useApp();
  const r = race(id);
  if (!r) return <main className="wrap"><Top back="/races/" /><p>404</p></main>;

  const levels = LEVELS.map((level) => {
    const items = suggest(id, level, rates);
    const s = items.length ? summarizeTrip(items, 'EUR', rates) : null;
    return { level, s };
  });
  const any = levels.some((l) => l.s);

  return (
    <main className="wrap">
      <Top back="/races/" label={`${t.step} 2 ${t.of} 4 · ${r.name[lang]} 2027`} />
      <h1>{t.howTravel}</h1>
      {r.status === 'uncertain' && <div className="note">{t.uncertainNote}</div>}
      <p className="muted">{any ? t.perPerson : t.noOffers}</p>
      <div className="stack">
        {levels.map(({ level, s }) => (
          <Link key={level} href={`/races/${id}/${level}/`} className="card">
            <div className="row">
              <b style={{ fontSize: 19 }}>{t[level]}</b>
              {s ? <Money amount={s.total} currency="EUR" /> : <span className="small muted">{t.noPrice}</span>}
            </div>
            <span className="muted" style={{ fontSize: 14 }}>{t[`${level}Text` as 'budgetText']}</span>
            {s && s.missing.length > 0 && <span className="small muted">{t.missing}: {s.missing.map((m) => t[m]).join(', ')}</span>}
          </Link>
        ))}
      </div>
      <div className="bottom">
        <a className="btn ghost" href={r.officialTicketsUrl} target="_blank" rel="noreferrer">{t.officialTickets}</a>
        <Link className="btn ghost" href={`/guides/${r.countryCode}/`}>{t.guide}</Link>
      </div>
    </main>
  );
}
