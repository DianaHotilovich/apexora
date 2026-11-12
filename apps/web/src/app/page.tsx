'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { daysUntil, getGuide, nextRace, Race, RACES, summarizeTrip } from '@driftora/shared';
import { Money, Top, useApp } from '@/components/App';
import { suggest } from '@/lib/data';

/**
 * Home always promotes the nearest Grand Prix. The date is read in the visitor's browser,
 * so the recommendation moves to the next race by itself the day after each race – no redeploy needed.
 */
export default function Home() {
  const { t, lang, rates } = useApp();
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => { setToday(new Date().toISOString().slice(0, 10)); }, []);

  const priceOf = (r: Race) => {
    const it = suggest(r.id, 'budget', rates);
    return it.length ? summarizeTrip(it, 'EUR', rates) : null;
  };
  const next = today ? nextRace(today) : null;
  const nextPrice = next ? priceOf(next) : null;
  // Second recommendation: the cheapest complete package still ahead in the season.
  const best = today
    ? RACES.filter((r) => r.date >= today && r.id !== next?.id)
        .map((r) => ({ r, s: priceOf(r) }))
        .filter((x) => x.s && x.s.missing.length === 0)
        .sort((a, b) => a.s!.total - b.s!.total)[0]
    : undefined;
  const country = (r: Race) => getGuide(r.countryCode)?.name[lang] ?? r.city;

  return (
    <main className="wrap">
      <Top />
      <section className="hero">
        <h1 className="hero-title">{t.heroTitle}</h1>
        <p className="muted" style={{ fontSize: 17 }}>{t.heroText}</p>
        {next && today && (
          <Link href={`/races/${next.id}/`} className="next">
            <span className="label">{t.nextGp}</span>
            <span className="label" style={{ textAlign: 'right' }}>{t.daysTo}</span>
            <span className="city">{country(next)}</span>
            <span className="days">{daysUntil(next.date, today)}</span>
            <span className="small muted" style={{ gridColumn: '1 / -1' }}>
              {next.circuit}, {new Date(next.date).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', { day: 'numeric', month: 'long' })}.{' '}
              {nextPrice ? <>{t.priceFrom} <Money amount={nextPrice.total} currency="EUR" /></> : t.salesSoon}
            </span>
          </Link>
        )}
      </section>
      {best && best.s && (
        <Link href={`/races/${best.r.id}/budget/`} className="level" style={{ borderBottomColor: 'var(--purple)' }}>
          <span className="label" style={{ gridColumn: '1 / -1', color: 'var(--purple)' }}>{t.bestValue}</span>
          <span className="lname">{country(best.r)}</span>
          <Money amount={best.s.total} currency="EUR" />
          <p>{best.r.circuit}, {new Date(best.r.date).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', { day: 'numeric', month: 'long' })}</p>
        </Link>
      )}
      <div className="facts">
        <div><b>{RACES.length}</b><span className="small muted">{t.races}</span></div>
        <div><b>3</b><span className="small muted">{t.levels}</span></div>
        <div><b>22</b><span className="small muted">{t.guides.toLowerCase()}</span></div>
      </div>
      <div className="bottom">
        <Link href="/races/" className="btn">{t.chooseRace}</Link>
        <div className="grid2">
          <Link href="/guides/" className="btn link">{t.guidesFirst}</Link>
          <Link href="/currency/" className="btn link">{t.converter}</Link>
        </div>
        <Link href="/waitlist/" className="btn link">{t.waitlist}</Link>
        <Link href="/privacy/" className="foot" style={{ textAlign: 'center' }}>{t.privacy}</Link>
      </div>
    </main>
  );
}
