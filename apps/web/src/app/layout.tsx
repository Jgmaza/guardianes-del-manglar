import type { Metadata, Viewport } from 'next';
import { Roboto, Roboto_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { RegisterSW } from '@/components/pwa/RegisterSW';
import './globals.css';

const sans = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-sans',
});

const mono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Guardianes del Manglar',
  description:
    'Ciencia ciudadana para monitorear el manglar del Atlántico y apoyar a la C.R.A. con evidencia verificable.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Guardianes',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b3b2c',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-[family-name:var(--font-sans)] antialiased">
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
