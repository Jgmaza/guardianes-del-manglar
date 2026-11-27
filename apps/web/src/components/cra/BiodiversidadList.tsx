'use client';

import { Button } from '@guardianes/ui';
import { BadgeCheck, Bird, Clock3, MapPin, Microscope } from 'lucide-react';
import { useMemo, useState } from 'react';
import { patchReportStatus, type DashboardReport } from '@/lib/api-client';
import { isAvistamiento, isOpenReport, statusLabel, timeAgo } from '@/lib/report-labels';

const TAG_TONES: Record<string, string> = {
  'Mangle rojo': 'bg-red-50 text-red-800 border-red-200',
  'Mangle negro': 'bg-slate-200 text-slate-800 border-slate-300',
  'Cangrejo azul': 'bg-blue-100 text-blue-800 border-blue-300',
  'Garza blanca': 'bg-slate-100 text-slate-700 border-slate-300',
  'Iguana verde': 'bg-lime-100 text-lime-800 border-lime-300',
  Pelícano: 'bg-orange-50 text-orange-800 border-orange-200',
  'Paisaje / visita': 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

function parseSpecies(description: string | null): string[] {
  if (!description) return [];
  const line = description.split('\n').find((l) => l.startsWith('Especies:'));
  if (!line) return [];
  return line
    .replace(/^Especies:\s*/i, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseAlias(description: string | null): string | null {
  if (!description) return null;
  const line = description.split('\n').find((l) => l.startsWith('Visitante:'));
  return line ? line.replace(/^Visitante:\s*/i, '').trim() : null;
}

export function BiodiversidadList({
  reports,
  loading,
  selectedId,
  onSelect,
  onRefresh,
}: {
  reports: DashboardReport[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (report: DashboardReport) => void;
  onRefresh: () => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const bio = useMemo(
    () =>
      reports
        .filter((r) => isAvistamiento(r.categoryCode))
        .slice()
        .sort(
          (a, b) =>
            new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
        ),
    [reports],
  );

  const validate = async (report: DashboardReport) => {
    setBusyId(report.id);
    setMessage(null);
    try {
      if (report.status === 'submitted' || report.status === 'needs_info') {
        await patchReportStatus(report.id, 'under_review', 'validación biodiversidad');
      }
      if (report.status !== 'accepted') {
        await patchReportStatus(report.id, 'accepted', 'validado por biólogo C.R.A.');
      }
      setMessage(`${report.trackingCode}: validado.`);
      await onRefresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo validar');
    } finally {
      setBusyId(null);
    }
  };

  const now = Date.now();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-600">
        Ciencia ciudadana · fotos «yo estuve aquí» · clic para ubicar en el mapa
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-3">
        {bio.length === 0 && !loading ? (
          <p className="rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            Aún no hay avistamientos. Los registros de /estuve-aqui aparecerán aquí.
          </p>
        ) : null}

        {bio.map((report) => {
          const tags = parseSpecies(report.description);
          const alias = parseAlias(report.description);
          const validated = report.status === 'accepted';
          const active = selectedId === report.id;
          const busy = busyId === report.id;
          return (
            <article
              key={report.id}
              className={`overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                active ? 'border-mg-600 ring-2 ring-mg-400/40' : 'border-slate-200'
              }`}
            >
              <button type="button" className="w-full text-left" onClick={() => onSelect(report)}>
                <div className="relative flex h-24 items-center justify-center bg-gradient-to-br from-emerald-500 to-mg-900">
                  <Bird className="h-10 w-10 text-white/90" aria-hidden />
                  <span className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold text-white">
                    Web · Yo estuve aquí
                  </span>
                  <span className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] text-white/80">
                    <Clock3 className="h-3 w-3" aria-hidden />
                    {timeAgo(report.receivedAt, now)}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="font-[family-name:var(--font-mono)] text-sm font-bold text-slate-900">
                    {report.trackingCode}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {alias ?? 'Visitante anónimo'} · {statusLabel(report.status)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {report.description?.split('\n').slice(-1)[0] || 'Sin nota'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                          TAG_TONES[t] ?? 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {validated ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                        <BadgeCheck className="h-3 w-3" aria-hidden />
                        Validado por biólogo C.R.A.
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        <Clock3 className="h-3 w-3" aria-hidden />
                        Pendiente de validación
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-[family-name:var(--font-mono)] text-[11px] text-slate-500">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>
              </button>
              {!validated && isOpenReport(report.status) ? (
                <div className="border-t border-slate-100 px-3 pb-3">
                  <Button
                    disabled={busy}
                    className="mt-3 w-full"
                    onClick={() => void validate(report)}
                  >
                    <Microscope className="h-4 w-4" aria-hidden />
                    Validación técnica (Biólogo C.R.A.)
                  </Button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      {message ? (
        <p className="border-t border-slate-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
