import type { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800-italic.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/600.css';
import { AppProvider } from '@/components/App';
import './globals.css';

export const metadata: Metadata = {
  title: 'GridTrip – plan your F1 Grand Prix trip',
  description: 'Ticket, stay and getting there for every Formula 1 race of 2027 – in one place, in your currency and language.',
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/manifest.json`,
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#13233f' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <div className="kerb" aria-hidden="true" />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
