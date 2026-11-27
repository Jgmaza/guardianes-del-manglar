'use client';

import { Award, Trees } from 'lucide-react';
import { formatBadgeTitle, type GuardianBadge } from '@/lib/badges';

export function GuardianBadgeCard({
  badge,
  compact = false,
}: {
  badge: GuardianBadge;
  compact?: boolean;
}) {
  const title = formatBadgeTitle(badge.species);
  const date = new Date(badge.earnedAt).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-emerald-700/30 bg-gradient-to-br from-mg-900 via-emerald-900 to-teal-800 text-white shadow-lg ${
        compact ? 'p-4' : 'p-6'
      }`}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-mg-400/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 left-10 h-28 w-28 rounded-full bg-teal-400/10"
        aria-hidden
      />

      <div className="relative flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mg-400 text-mg-950 shadow">
          <Award className="h-7 w-7" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-mg-300">
            Insignia · Yo estuve aquí
          </p>
          <h3 className={`font-black leading-tight ${compact ? 'text-lg' : 'text-2xl'}`}>{title}</h3>
          {badge.alias ? (
            <p className="mt-1 text-sm text-emerald-100">{badge.alias}</p>
          ) : null}
        </div>
      </div>

      {!compact && badge.photoPreviewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={badge.photoPreviewUrl}
          alt="Tu foto en el manglar"
          className="relative mt-4 h-36 w-full rounded-xl object-cover ring-2 ring-white/20"
        />
      ) : null}

      <div className="relative mt-4 flex flex-wrap items-center gap-2 text-xs">
        {badge.species.map((s) => (
          <span
            key={s}
            className="rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 font-semibold"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="relative mt-4 flex items-end justify-between gap-3 border-t border-white/15 pt-3 text-xs text-emerald-100">
        <span className="flex items-center gap-1.5">
          <Trees className="h-3.5 w-3.5" aria-hidden />
          Mallorquín · Atlántico
        </span>
        <span className="text-right">
          <span className="block font-[family-name:var(--font-mono)] text-[10px] text-mg-300">
            {badge.latitude.toFixed(4)}, {badge.longitude.toFixed(4)}
          </span>
          <span>{date}</span>
        </span>
      </div>
    </div>
  );
}
