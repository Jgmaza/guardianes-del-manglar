import type { Metadata, Viewport } from 'next';
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/latin-700.css';
import '@fontsource/roboto/latin-900.css';
import '@fontsource/roboto-mono/latin-400.css';
import type { ReactNode } from 'react';
import { RegisterSW } from '@/components/pwa/RegisterSW';
import './globals.css';

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
    <html lang="es">
      <body className="font-[family-name:var(--font-sans)] antialiased">
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
