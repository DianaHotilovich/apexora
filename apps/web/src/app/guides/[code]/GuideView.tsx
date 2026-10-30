'use client';

import Link from 'next/link';
import { Top, useApp } from '@/components/App';
import { guide } from '@/lib/data';

export default function GuideView({ code }: { code: string }) {
  const { t, lang } = useApp();
  const g = guide(code);
  if (!g) return <main className="wrap"><Top back="/guides/" /><p>404</p></main>;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  return (
    <main className="wrap">
      <Top back="/guides/" />
      <div className="eyebrow">GridTrip</div>
      <h1 style={{ fontSize: 32 }}>{g.name[lang]}</h1>
      <div className="muted small">Grand Prix: {g.gpLabel[lang]} · {g.place[lang]}</div>
      <div className="sos-box">
        <div className="small strong" style={{ color: '#8e1d17', letterSpacing: '.08em' }}>{t.emergency.toUpperCase()}</div>
        <div className="nums">
          {g.sos.map((s) => <a key={s.number + s.label.en} href={`tel:${s.number}`} style={{ textDecoration: 'none' }}><b>{s.number}</b><span>{s.label[lang]}</span></a>)}
        </div>
      </div>
      <div className="info">{g.warning[lang]}</div>
      <div className="card"><div className="eyebrow">{t.sim}</div><p className="small">{g.sim[lang]}</p></div>
      <div className="grid2">
        <div className="card"><div className="eyebrow">{t.moving}</div><p className="small">{g.transport[lang]}</p></div>
        <div className="card"><div className="eyebrow">{t.money}</div><p className="small">{g.money[lang]}<br />{g.language[lang]}</p></div>
      </div>
      <div className="card">
        <div className="eyebrow">{t.phrases}</div>
        {g.phrases.map((p) => <div key={p.local} className="phrase"><span className="muted">{p.text[lang]}</span><b>{p.local}</b></div>)}
      </div>
      <p className="foot">{t.dataFrom} · {g.sources[lang]}</p>
      <div className="bottom grid2">
        <a className="btn dark-btn" href={`${base}/pdf/${lang}/${g.code}.pdf`} download>{t.downloadPdf}</a>
        <Link className="btn red" href={`/sos/${g.code}/`}>{t.sos}</Link>
      </div>
    </main>
  );
}
