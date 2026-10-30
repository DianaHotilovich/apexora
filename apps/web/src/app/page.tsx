'use client';

import Link from 'next/link';
import { daysUntil, getGuide, RACES, summarizeTrip } from '@gridtrip/shared';
import { Money, Top, useApp } from '@/components/App';
import { suggest } from '@/lib/data';

export default function Home() {
  const { t, lang, rates } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  // The next race that already has sourced packages is the hero: a real trip, not a slogan.
  const upcoming = RACES.filter((r) => r.date >= today);
  const complete = (id: string) => { const it = suggest(id, 'budget', rates); return it.length > 0 && summarizeTrip(it, 'EUR', rates).missing.length === 0; };
  const featured = upcoming.find((r) => complete(r.id)) ?? upcoming.find((r) => suggest(r.id, 'budget', rates).length > 0);
  const fromEur = featured ? summarizeTrip(suggest(featured.id, 'budget', rates), 'EUR', rates).total : null;

  return (
    <main className="wrap">
      <Top />
      <section className="hero">
        <h1 className="hero-title">{t.heroTitle}</h1>
        <p className="muted" style={{ fontSize: 17 }}>{t.heroText}</p>
        {featured && fromEur !== null && (
          <Link href={`/races/${featured.id}/`} className="next">
            <span className="label">{t.featured}</span>
            <span className="label" style={{ textAlign: 'right' }}>{t.daysTo}</span>
            <span className="city">{getGuide(featured.countryCode)?.name[lang] ?? featured.city}</span>
            <span className="days">{daysUntil(featured.date, today)}</span>
            <span className="small muted">{featured.circuit} · {t.priceFrom} <Money amount={fromEur} currency="EUR" /></span>
          </Link>
        )}
      </section>
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
      </div>
    </main>
  );
}
