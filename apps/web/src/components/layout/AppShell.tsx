'use client';

import { ClipboardList, House, Camera, ShieldCheck, Trees, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { OnlineIndicator } from './OnlineIndicator';

const CITIZEN_NAV = [
  { href: '/', label: 'Inicio', icon: House },
  { href: '/reportar', label: 'Reportar', icon: Camera },
  { href: '/seguimiento', label: 'Seguimiento', icon: ClipboardList },
];

export function AppShell({
  children,
  variant = 'citizen',
}: {
  children: ReactNode;
  variant?: 'citizen' | 'cra';
}) {
  const pathname = usePathname();
  const isCra = variant === 'cra';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-mg-900 text-white shadow-lg">
        <div
          className={`mx-auto flex flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between ${isCra ? 'max-w-[1440px]' : 'max-w-6xl md:px-8'}`}
        >
          <Link href={isCra ? '/cra' : '/'} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mg-500">
              <Trees className="h-6 w-6 text-mg-950" aria-hidden />
            </span>
            <span>
              <span className="block text-lg font-bold leading-tight">
                Guardianes del Manglar
                {isCra ? (
                  <span className="hidden font-normal text-mg-100 sm:inline"> — Panel C.R.A.</span>
                ) : null}
              </span>
              <span className="block text-xs text-emerald-200">
                {isCra
                  ? 'C.R.A. Atlántico · Gestión de reportes'
                  : 'Ciencia ciudadana · Atlántico'}
              </span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {!isCra ? (
              <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="Principal">
                {CITIZEN_NAV.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                        active ? 'bg-mg-800 text-white' : 'text-mg-100 hover:bg-mg-800/60'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            ) : null}
            <nav
              className="flex rounded-full bg-mg-950 p-1 text-sm"
              aria-label="Selector de vista"
            >
              <Link
                href="/"
                aria-current={!isCra ? 'page' : undefined}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold sm:px-4 ${
                  !isCra ? 'bg-mg-400 text-mg-950' : 'text-emerald-100 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" aria-hidden />
                {isCra ? 'Vista ciudadana' : 'Ciudadano'}
              </Link>
              <Link
                href="/cra"
                aria-current={isCra ? 'page' : undefined}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold sm:px-4 ${
                  isCra ? 'bg-mg-400 text-mg-950' : 'text-emerald-100 hover:text-white'
                }`}
              >
                <ShieldCheck className="h-4 w-4" aria-hidden />
                {isCra ? 'Panel C.R.A.' : 'Acceso C.R.A.'}
              </Link>
            </nav>
            <OnlineIndicator />
          </div>
        </div>
      </header>

      <main
        className={`mx-auto w-full flex-1 px-4 py-6 ${isCra ? 'max-w-[1440px]' : 'max-w-6xl pb-28 md:px-8 md:pb-10'}`}
      >
        {children}
      </main>

      {!isCra ? (
        <nav
          className="fixed inset-x-4 bottom-3 z-[1100] flex h-14 items-center justify-around rounded-full border border-slate-200 bg-white/90 p-1.5 shadow-lg backdrop-blur md:hidden"
          aria-label="Navegación inferior"
        >
          {CITIZEN_NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-full px-4 py-1 text-[10px] font-semibold ${
                  active ? 'bg-mg-50 text-mg-800' : 'text-slate-500'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
