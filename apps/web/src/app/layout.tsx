import type { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800-italic.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/600.css';
import { AppProvider, Disclaimer } from '@/components/App';
import './globals.css';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dianahotilovich.github.io';
const DESCRIPTION = 'Bilet, nocleg i dojazd na każdy wyścig F1 2027 – w jednym planie, w Twojej walucie. Ticket, stay and travel for every 2027 Grand Prix.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'Apexora – cały wyjazd na Grand Prix w jednym miejscu',
  description: DESCRIPTION,
  manifest: `${BASE}/manifest.json`,
  icons: { icon: [{ url: `${BASE}/favicon.ico` }, { url: `${BASE}/icon-192.png`, type: 'image/png', sizes: '192x192' }], apple: `${BASE}/apple-touch-icon.png` },
  openGraph: {
    type: 'website', siteName: 'Apexora', locale: 'pl_PL', url: `${BASE}/`,
    title: 'Apexora – cały wyjazd na Grand Prix w jednym miejscu', description: DESCRIPTION,
    images: [{ url: `${BASE}/og.png`, width: 1200, height: 630, alt: 'Apexora – przepustka na Grand Prix Węgier' }],
  },
  twitter: { card: 'summary_large_image', title: 'Apexora', description: DESCRIPTION, images: [`${BASE}/og.png`] },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#13233f' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <div className="kerb" aria-hidden="true" />
        <AppProvider>{children}<Disclaimer /></AppProvider>
      </body>
    </html>
  );
}
