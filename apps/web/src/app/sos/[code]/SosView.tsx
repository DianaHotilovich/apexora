'use client';

import { useEffect, useState } from 'react';
import { Top, useApp } from '@/components/App';
import { guide } from '@/lib/data';
import { load, save } from '@/lib/store';

export default function SosView({ code }: { code: string }) {
  const { t, lang } = useApp();
  const g = guide(code);
  const [hotel, setHotel] = useState('');
  useEffect(() => { setHotel(load<string>(`hotel-${code}`) ?? ''); }, [code]);
  if (!g) return <main className="wrap"><Top back="/" /><p>404</p></main>;
  const main = g.sos[0];

  return (
    <div className="dark" style={{ minHeight: '100dvh' }}>
      <main className="wrap">
        <Top back={`/guides/${g.code}/`} label={t.offline} />
        <h1>{t.helpIn} · {g.name[lang]}</h1>
        <a className="callbig" href={`tel:${main.number}`}>{main.number}<small>{t.callNow} · {main.label[lang]}</small></a>
        {g.sos.length > 1 && (
          <div className="grid3">
            {g.sos.slice(1).map((s) => <a key={s.number + s.label.en} className="btn ghost" href={`tel:${s.number}`}>{s.label[lang]} {s.number}</a>)}
          </div>
        )}
        <div className="card">
          <div className="section-title">{t.myHotel}</div>
          <label className="field"><span className="sr">{t.myHotel}</span>
            <textarea value={hotel} placeholder={t.hotelPh} onChange={(e) => { setHotel(e.target.value); save(`hotel-${code}`, e.target.value); }} style={{ fontSize: 18 }} />
          </label>
        </div>
        <div className="card" style={{ background: 'var(--navy2)', color: '#fff', gap: 0 }}>
          {g.phrases.map((p) => (
            <div key={p.local} className="phrase"><span className="muted">{p.text[lang]}</span><b>{p.local}</b></div>
          ))}
        </div>
      </main>
    </div>
  );
}
