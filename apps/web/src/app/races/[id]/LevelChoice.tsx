'use client';

import Link from 'next/link';
import { getGuide, Level, summarizeTrip } from '@apexora/shared';
import { Money, Top, useApp } from '@/components/App';
import { race, suggest } from '@/lib/data';
import { RaceAlert } from '@/components/RaceAlert';

const LEVELS: Level[] = ['budget', 'standard', 'premium'];

export default function LevelChoice({ id }: { id: string }) {
  const { t, lang, rates } = useApp();
  const r = race(id);
  if (!r) return <main className="wrap"><Top back="/races/" /><p>404</p></main>;

  const levels = LEVELS.map((level) => {
    const items = suggest(id, level, rates);
    return { level, s: items.length ? summarizeTrip(items, 'EUR', rates) : null };
  });
  const any = levels.some((l) => l.s);

  return (
    <main className="wrap">
      <Top back="/races/" label={`${t.step} 2 ${t.of} 4`} />
      <div>
        <div className="step">{r.name[lang]} 2027, {r.circuit}</div>
        <h1 style={{ fontSize: 56, textTransform: 'uppercase' }}>{getGuide(r.countryCode)?.name[lang] ?? r.city}</h1>
      </div>
      {r.status === 'uncertain' && <div className="note">{t.uncertainNote}</div>}
      <p className="muted">{any ? t.perPerson : t.noOffers}</p>
      <div className="stack">
        {levels.map(({ level, s }) => (
          <Link key={level} href={`/races/${id}/${level}/`} className="level">
            <span className="lname">{t[level]}</span>
            {s ? <Money amount={s.total} currency="EUR" /> : <span className="label">{t.noPrice}</span>}
            <p>{t[`${level}Text` as 'budgetText']}{s && s.missing.length > 0 ? `. ${t.missing}: ${s.missing.map((m) => t[m]).join(', ')}` : ''}</p>
          </Link>
        ))}
      </div>
      {!any && <RaceAlert raceId={id} />}
      <div className="bottom grid2">
        <a className="btn ghost" href={r.officialTicketsUrl} target="_blank" rel="noreferrer">{t.officialTickets}</a>
        <Link className="btn ghost" href={`/guides/${r.countryCode}/`}>{t.guide}</Link>
      </div>
    </main>
  );
}
