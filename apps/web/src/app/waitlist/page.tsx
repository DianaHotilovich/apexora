'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Top, useApp } from '@/components/App';
import { DEMO, joinWaitlist } from '@/lib/data';

export default function Waitlist() {
  const { t, lang } = useApp();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMsg(t.invalidEmail); return; }
    try {
      const r = await joinWaitlist(email, lang);
      setMsg(r === 'joined' ? `${t.joined}${DEMO ? ` ${t.demoSaved}` : ''}` : t.already);
    } catch {
      setMsg(t.error);
    }
  };

  return (
    <div className="dark" style={{ minHeight: '100dvh' }}>
      <main className="wrap">
        <Top back="/" />
        <div className="step" style={{ marginTop: 32 }}>{t.season}</div>
        <h1 className="hero-title">{t.joinTitle}</h1>
        <p className="muted">{t.joinText}</p>
        <form onSubmit={submit} className="stack">
          <label className="field" style={{ color: '#c4cae0' }}>{t.email}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <p className="small muted">{t.waitlistConsent} <Link href="/privacy/" style={{ color: 'var(--pink)' }}>{t.privacy}</Link></p>
          <button className="btn" type="submit">{t.join}</button>
        </form>
        {msg && <p role="status">{msg}</p>}
      </main>
    </div>
  );
}
