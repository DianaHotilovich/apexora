'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useApp } from '@/components/App';
import { DEMO, joinRaceAlert } from '@/lib/data';

/** Be first when sales open: one e-mail for one race. */
export function RaceAlert({ raceId }: { raceId: string }) {
  const { t, lang } = useApp();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMsg(t.invalidEmail); return; }
    try {
      const r = await joinRaceAlert(email, raceId, lang);
      setMsg(r === 'joined' ? `${t.alertDone}${DEMO ? ` ${t.demoSaved}` : ''}` : t.alertAlready);
    } catch {
      setMsg(t.error);
    }
  };
  return (
    <form className="card" onSubmit={submit} aria-labelledby={`alert-${raceId}`}>
      <div id={`alert-${raceId}`} className="section-title">{t.alertTitle}</div>
      <p className="small muted">{t.alertText}</p>
      <label className="field">{t.email}<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <button className="btn dark-btn" type="submit">{t.alertBtn}</button>
      {msg && <p className="small" role="status">{msg}</p>}
      <p className="foot"><Link href="/privacy/">{t.privacy}</Link></p>
    </form>
  );
}
