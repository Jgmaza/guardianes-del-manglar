import type { Metadata, Viewport } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import type { ReactNode } from 'react';
import { RegisterSW } from '@/components/pwa/RegisterSW';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
});

const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
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
  themeColor: '#1f6b4a',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body
        className={`${display.variable} ${sans.variable} font-[family-name:var(--font-sans)] antialiased`}
      >
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
