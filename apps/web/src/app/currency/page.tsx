'use client';

import { useState } from 'react';
import { convert, formatMoney, hasRate } from '@apexora/shared';
import { Top, useApp } from '@/components/App';

export default function Currency() {
  const { t, rates, currency, lang } = useApp();
  const [from, setFrom] = useState('EUR');
  const [amount, setAmount] = useState('100');
  const codes = Object.keys(rates.rates).sort();
  const locale = lang === 'pl' ? 'pl-PL' : 'en-GB';
  const n = Number(amount.replace(',', '.')) || 0;
  const ok = hasRate(rates, from) && hasRate(rates, currency);

  return (
    <main className="wrap">
      <Top back="/" label={t.offline} />
      <h1>{t.converter}</h1>
      <div className="card" style={{ gap: 12 }}>
        <div className="grid2">
          <label className="field">{t.amountIn}
            <select value={from} onChange={(e) => setFrom(e.target.value)}>{codes.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label className="field">&nbsp;
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label={t.amountIn} style={{ fontSize: 22, fontWeight: 700 }} />
          </label>
        </div>
        <div className="muted small strong">{t.isAbout}</div>
        <div className="big-result">
          {ok ? formatMoney(convert(n, from, currency, rates), currency, locale) : '—'}
        </div>
        {!ok && <p className="small">{t.rateMissing}</p>}
        <p className="small muted">{t.rateFrom}: {rates.source} · {rates.date} · {rates.live ? t.liveRate : t.savedRate}</p>
      </div>
      <div className="note"><b>{t.dcc}</b></div>
    </main>
  );
}
