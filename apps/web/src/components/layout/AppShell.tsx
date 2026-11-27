'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { OnlineIndicator } from './OnlineIndicator';

export function AppShell({
  children,
  variant = 'citizen',
}: {
  children: ReactNode;
  variant?: 'citizen' | 'cra';
}) {
  const nav =
    variant === 'citizen'
      ? [
          { href: '/', label: 'Inicio' },
          { href: '/reportar', label: 'Reportar' },
          { href: '/seguimiento', label: 'Seguimiento' },
        ]
      : [
          { href: '/cra', label: 'Resumen' },
          { href: '/', label: 'Vista ciudadana' },
        ];

  return (
    <div className="min-h-screen">
      <div className="tide-bar h-1 w-full" aria-hidden />
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div>
            <Link
              href={variant === 'cra' ? '/cra' : '/'}
              className="font-[family-name:var(--font-display)] text-xl text-[var(--foreground)]"
            >
              Guardianes del Manglar
            </Link>
            <p className="text-xs text-[var(--muted)]">
              {variant === 'cra' ? 'Panel C.R.A. · gestión' : 'Ciencia ciudadana · Atlántico'}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-[var(--muted)] transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            {variant === 'citizen' ? (
              <Link
                href="/cra"
                className="rounded-md px-3 py-1.5 text-[var(--gdm-sand)] transition hover:bg-white/10"
              >
                Acceso C.R.A.
              </Link>
            ) : null}
            <OnlineIndicator />
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</div>
    </div>
  );
}
