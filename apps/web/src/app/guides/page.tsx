'use client';

import Link from 'next/link';
import { GUIDES } from '@gridtrip/shared';
import { Top, useApp } from '@/components/App';

export default function Guides() {
  const { t, lang } = useApp();
  return (
    <main className="wrap">
      <Top back="/" />
      <h1>{t.guides}</h1>
      <p className="muted">{t.guidesText}</p>
      <div className="list-guides">
        {[...GUIDES].sort((a, b) => a.name[lang].localeCompare(b.name[lang])).map((g) => (
          <Link key={g.code} href={`/guides/${g.code}/`} className="card">
            <b>{g.name[lang]}</b>
            <span className="small muted">{g.place[lang]}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
