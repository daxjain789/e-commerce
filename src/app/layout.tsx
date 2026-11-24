import type { Metadata, Viewport } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { getSettings } from '@/lib/settings';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings();
  return {
    title: {
      default: `${settings.siteName} — ${settings.tagline}`,
      template: `%s · ${settings.siteName}`,
    },
    description: settings.description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    openGraph: {
      title: settings.siteName,
      description: settings.description,
      type: 'website',
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#f7f3ec',
  width: 'device-width',
  initialScale: 1,
};

function hexToRgbTriple(hex: string): string {
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const value = /^[0-9a-fA-F]{6}$/.test(full) ? full : 'b4552d';
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = getSettings();
  return (
    <html lang="en">
      <body
        className="min-h-screen bg-paper font-sans text-ink antialiased"
        style={{ '--accent': hexToRgbTriple(settings.accentColor) } as CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}
