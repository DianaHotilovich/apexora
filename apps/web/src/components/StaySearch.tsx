'use client';

import { useState } from 'react';
import { airbnbUrl, bookingUrl, defaultStay, searchCity } from '@apexora/shared';
import { useApp } from '@/components/App';

/** Pick dates and a nightly budget, then open Booking.com or Airbnb with those filters already applied. */
export function StaySearch({ city, raceDate, guests }: { city: string; raceDate: string; guests: number }) {
  const { t } = useApp();
  const d = defaultStay(raceDate);
  const [checkIn, setIn] = useState(d.checkIn);
  const [checkOut, setOut] = useState(d.checkOut);
  const [max, setMax] = useState('');
  const q = { city: searchCity(city), checkIn, checkOut, guests, maxPerNightEur: Number(max) || undefined };
  const valid = checkIn < checkOut;

  return (
    <section className="card" aria-labelledby="stay-h">
      <div id="stay-h" className="section-title">{t.findStay}</div>
      <p className="small muted">{t.findStayText}</p>
      <div className="grid2">
        <label className="field">{t.checkIn}<input type="date" value={checkIn} onChange={(e) => setIn(e.target.value)} /></label>
        <label className="field">{t.checkOut}<input type="date" value={checkOut} min={checkIn} onChange={(e) => setOut(e.target.value)} /></label>
      </div>
      <label className="field">{t.maxNight}<input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} placeholder="150" /></label>
      <div className="grid2" style={{ marginTop: 6 }}>
        <a className={`btn dark-btn${valid ? '' : ' disabled'}`} aria-disabled={!valid} href={valid ? bookingUrl(q) : undefined} target="_blank" rel="noreferrer">Booking.com</a>
        <a className={`btn dark-btn${valid ? '' : ' disabled'}`} aria-disabled={!valid} href={valid ? airbnbUrl(q) : undefined} target="_blank" rel="noreferrer">Airbnb</a>
      </div>
      <p className="foot">{t.stayNote}</p>
    </section>
  );
}
