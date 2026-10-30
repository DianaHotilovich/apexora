import type { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import { AppProvider } from '@/components/App';
import './globals.css';

export const metadata: Metadata = {
  title: 'GridTrip – plan your F1 Grand Prix trip',
  description: 'Ticket, stay and getting there for every Formula 1 race of 2027 – in one place, in your currency and language.',
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/manifest.json`,
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#12172b' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
