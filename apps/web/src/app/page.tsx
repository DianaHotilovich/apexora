'use client';

import Link from 'next/link';
import { RACES } from '@gridtrip/shared';
import { Top, useApp } from '@/components/App';

export default function Home() {
  const { t } = useApp();
  return (
    <div className="dark" style={{ minHeight: '100dvh' }}>
      <main className="wrap">
        <Top />
        <div className="stack" style={{ marginTop: 48, gap: 16 }}>
          <div className="eyebrow">{t.season}</div>
          <h1 className="hero">{t.heroTitle}</h1>
          <p className="muted" style={{ fontSize: 17 }}>{t.heroText}</p>
        </div>
        <div className="grid3" style={{ marginTop: 24 }}>
          <div className="stat"><b>{RACES.length}</b><span className="small muted">{t.races}</span></div>
          <div className="stat"><b>3</b><span className="small muted">{t.levels}</span></div>
          <div className="stat"><b>2</b><span className="small muted">{t.currencies}</span></div>
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
    </div>
  );
}
