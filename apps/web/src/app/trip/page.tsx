'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { daysUntil } from '@driftora/shared';
import { Top, useApp } from '@/components/App';
import { checklist, race, SavedTrip } from '@/lib/data';
import { load, save } from '@/lib/store';

export default function Trip() {
  const { t, lang } = useApp();
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  useEffect(() => { setTrip(load('trip')); }, []);

  if (!trip) {
    return (
      <main className="wrap">
        <Top back="/" />
        <p>{t.noTrip}</p>
        <Link href="/races/" className="btn">{t.chooseRace}</Link>
      </main>
    );
  }
  const r = race(trip.raceId)!;
  const items = checklist(r.countryCode, r.date, lang);
  const done = new Set(trip.done ?? []);
  const toggle = (id: string) => {
    const next = new Set(done);
    if (next.has(id)) next.delete(id); else next.add(id);
    const updated = { ...trip, done: [...next] };
    setTrip(updated); save('trip', updated);
  };
  const days = daysUntil(r.date, new Date().toISOString().slice(0, 10));
  const pct = Math.round((done.size / items.length) * 100);

  return (
    <main className="wrap">
      <Top back="/" />
      {trip.status === 'paid' && <div className="ok-box">{t.paid}</div>}
      {trip.status === 'scheduled' && <div className="ok-box">{t.scheduled}</div>}
      {trip.status === 'payment_pending' && <div className="note">{t.pending}</div>}
      <h1>{t.beforeTrip}</h1>
      <div className="muted small">{r.name[lang]} · {days} {t.daysTo} · {done.size}/{items.length} {t.ready}</div>
      <div className="progress" aria-hidden="true"><div style={{ width: `${pct}%` }} /></div>
      <div className="card" style={{ gap: 0 }}>
        {items.map((i) => (
          <label key={i.id} className="check">
            <input type="checkbox" checked={done.has(i.id)} onChange={() => toggle(i.id)} /><span>{i.text}</span>
          </label>
        ))}
      </div>
      <div className="bottom grid2">
        <Link href={`/guides/${r.countryCode}/`} className="btn ghost">{t.guide}</Link>
        <Link href={`/sos/${r.countryCode}/`} className="btn sosb">{t.sos}</Link>
      </div>
    </main>
  );
}
