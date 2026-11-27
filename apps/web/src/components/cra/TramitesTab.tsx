'use client';

import { Button } from '@guardianes/ui';
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  FileWarning,
  MapPin,
  RefreshCw,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  patchReportStatus,
  type DashboardReport,
} from '@/lib/api-client';
import {
  isOpenReport,
  priorityStyle,
  statusLabel,
  statusTone,
  timeAgo,
} from '@/lib/report-labels';

type TramiteFilter = 'pending' | 'review' | 'resolved' | 'all';

function channelLabel(channel: string): string {
  if (channel === 'pwa') return 'Web';
  if (channel === 'whatsapp') return 'WhatsApp';
  return channel;
}

function canApprove(status: string): boolean {
  return (
    status === 'geo_processed' ||
    status === 'under_review' ||
    status === 'submitted' ||
    status === 'needs_info'
  );
}

/** Statuses that cannot jump straight to accepted. */
function needsReviewBeforeAccept(status: string): boolean {
  return status === 'submitted' || status === 'needs_info';
}

function canReject(status: string): boolean {
  return isOpenReport(status) && status !== 'alerted';
}

function canRequestInfo(status: string): boolean {
  return status === 'submitted' || status === 'geo_processed' || status === 'under_review';
}

export function TramitesTab({
  reports,
  loading,
  onRefresh,
}: {
  reports: DashboardReport[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [filter, setFilter] = useState<TramiteFilter>('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  /** Registros ciudadanos hechos por la web (PWA); son el trámite a gestionar. */
  const webReports = useMemo(
    () => reports.filter((r) => r.channel === 'pwa'),
    [reports],
  );

  const summary = useMemo(() => {
    const pending = webReports.filter(
      (r) =>
        r.status === 'submitted' ||
        r.status === 'geo_processed' ||
        r.status === 'needs_info',
    ).length;
    const review = webReports.filter((r) => r.status === 'under_review').length;
    const accepted = webReports.filter((r) => r.status === 'accepted').length;
    const rejected = webReports.filter((r) => r.status === 'rejected').length;
    return { pending, review, accepted, rejected, total: webReports.length };
  }, [webReports]);

  const filtered = useMemo(() => {
    return webReports
      .filter((r) => {
        if (filter === 'pending') {
          return (
            r.status === 'submitted' ||
            r.status === 'geo_processed' ||
            r.status === 'needs_info'
          );
        }
        if (filter === 'review') return r.status === 'under_review';
        if (filter === 'resolved') {
          return r.status === 'accepted' || r.status === 'rejected' || r.status === 'alerted';
        }
        return true;
      })
      .slice()
      .sort(
        (a, b) =>
          new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
      );
  }, [webReports, filter]);

  const selected = filtered.find((r) => r.id === selectedId) ?? webReports.find((r) => r.id === selectedId) ?? null;

  const runAction = async (id: string, action: () => Promise<string>) => {
    setBusyId(id);
    setMessage(null);
    try {
      setMessage(await action());
      await onRefresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'La acción falló');
    } finally {
      setBusyId(null);
    }
  };

  const now = Date.now();

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={ClipboardList}
          tone="bg-amber-100 text-amber-800"
          label="Pendientes"
          hint="Por tomar"
          value={loading ? '…' : String(summary.pending)}
        />
        <Stat
          icon={Eye}
          tone="bg-mg-50 text-mg-800"
          label="En revisión"
          hint="En atención C.R.A."
          value={String(summary.review)}
        />
        <Stat
          icon={BadgeCheck}
          tone="bg-emerald-100 text-emerald-800"
          label="Aprobados"
          hint="Aceptados"
          value={String(summary.accepted)}
        />
        <Stat
          icon={XCircle}
          tone="bg-slate-100 text-slate-600"
          label="Rechazados"
          hint={`${summary.total} registros web`}
          value={String(summary.rejected)}
        />
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[1.15fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">Gestión de trámites</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Registros enviados desde la web ciudadana · aprobar, pedir info o rechazar
                </p>
              </div>
              <Button variant="secondary" onClick={() => void onRefresh()} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
                Actualizar
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Filtro de trámites">
              {(
                [
                  ['pending', 'Pendientes', summary.pending],
                  ['review', 'En revisión', summary.review],
                  ['resolved', 'Resueltos', summary.accepted + summary.rejected],
                  ['all', 'Todos', summary.total],
                ] as const
              ).map(([id, label, count]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filter === id}
                  onClick={() => setFilter(id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    filter === id
                      ? 'bg-mg-900 text-white'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {label}
                  <span className="ml-1.5 opacity-80">{count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[640px] space-y-3 overflow-y-auto bg-slate-50/60 p-3">
            {filtered.length === 0 && !loading ? (
              <p className="rounded-xl border-2 border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                {webReports.length === 0
                  ? 'Aún no hay registros web. Los envíos desde /reportar aparecerán aquí para aprobación C.R.A.'
                  : 'No hay trámites en este filtro.'}
              </p>
            ) : null}

            {filtered.map((report) => {
              const pri = priorityStyle(report.priorityHint);
              const active = selected?.id === report.id;
              const busy = busyId === report.id;
              return (
                <article
                  key={report.id}
                  className={`rounded-xl border border-l-4 bg-white p-3 shadow-sm transition ${
                    active ? 'border-mg-600 ring-2 ring-mg-400/40' : 'border-slate-200'
                  }`}
                  style={{ borderLeftColor: pri.color }}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setSelectedId(report.id)}
                    aria-pressed={active}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                        {channelLabel(report.channel)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock3 className="h-3 w-3" aria-hidden />
                        {timeAgo(report.receivedAt, now)}
                      </span>
                    </div>
                    <p className="mt-2 font-[family-name:var(--font-mono)] text-sm font-bold text-slate-900">
                      {report.trackingCode}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {report.description || 'Sin descripción'}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                      {report.categoryLabel ?? report.categoryCode ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                          {report.categoryLabel ?? report.categoryCode}
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-2 py-0.5 font-bold ${statusTone(report.status)}`}
                      >
                        {statusLabel(report.status)}
                      </span>
                      <span className={`rounded border px-1.5 py-0.5 font-bold ${pri.badge}`}>
                        {pri.label}
                      </span>
                    </div>
                  </button>

                  {isOpenReport(report.status) ? (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                      {canApprove(report.status) && report.status !== 'under_review' ? (
                        <Button
                          disabled={busy}
                          onClick={() =>
                            void runAction(report.id, async () => {
                              await patchReportStatus(report.id, 'under_review', 'toma de trámite CRA');
                              return `${report.trackingCode}: en revisión.`;
                            })
                          }
                        >
                          <Eye className="h-4 w-4" aria-hidden />
                          Tomar
                        </Button>
                      ) : null}
                      {canApprove(report.status) ? (
                        <Button
                          disabled={busy}
                          className="bg-emerald-700! hover:bg-emerald-800!"
                          onClick={() =>
                            void runAction(report.id, async () => {
                              if (needsReviewBeforeAccept(report.status)) {
                                await patchReportStatus(report.id, 'under_review', 'pre-aprobación');
                              }
                              await patchReportStatus(report.id, 'accepted', 'aprobado por C.R.A.');
                              return `${report.trackingCode}: trámite aprobado.`;
                            })
                          }
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden />
                          Aprobar
                        </Button>
                      ) : null}
                      {canRequestInfo(report.status) ? (
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() =>
                            void runAction(report.id, async () => {
                              await patchReportStatus(
                                report.id,
                                'needs_info',
                                'C.R.A. solicita más información',
                              );
                              return `${report.trackingCode}: se pidió información.`;
                            })
                          }
                        >
                          <FileWarning className="h-4 w-4" aria-hidden />
                          Pedir info
                        </Button>
                      ) : null}
                      {canReject(report.status) ? (
                        <Button
                          variant="secondary"
                          disabled={busy}
                          className="border-red-600! text-red-700! hover:bg-red-50!"
                          onClick={() =>
                            void runAction(report.id, async () => {
                              await patchReportStatus(report.id, 'rejected', 'rechazado por C.R.A.');
                              return `${report.trackingCode}: trámite rechazado.`;
                            })
                          }
                        >
                          <XCircle className="h-4 w-4" aria-hidden />
                          Rechazar
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      Trámite cerrado · {statusLabel(report.status)}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-4">
          {selected ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Detalle del trámite
                </p>
                <h3 className="mt-1 font-[family-name:var(--font-mono)] text-xl font-bold text-slate-900">
                  {selected.trackingCode}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusTone(selected.status)}`}>
                    {statusLabel(selected.status)}
                  </span>
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-800">
                    Canal {channelLabel(selected.channel)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-700">{selected.description || 'Sin descripción'}</p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {(
                  [
                    ['Categoría', selected.categoryLabel ?? selected.categoryCode ?? '—'],
                    ['Prioridad', priorityStyle(selected.priorityHint).label],
                    ['Observado', new Date(selected.observedAt).toLocaleString('es-CO')],
                    ['Recibido', new Date(selected.receivedAt).toLocaleString('es-CO')],
                    [
                      'Ubicación',
                      `${selected.location.latitude.toFixed(4)}, ${selected.location.longitude.toFixed(4)}`,
                    ],
                    ['Evidencias', String(selected.evidenceCount)],
                    ['Zona / UH', `${selected.zoneHydro ?? '—'}${selected.unitHydro ? ` / ${selected.unitHydro}` : ''}`],
                    ['Especie', selected.dominantSpecies ?? 'sin cobertura'],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                Fuente ubicación: {selected.location.source}
              </p>
            </div>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center text-sm text-slate-500">
              <ClipboardList className="mb-2 h-8 w-8 text-slate-300" aria-hidden />
              Selecciona un trámite de la lista para ver el detalle.
            </div>
          )}
          {message ? (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800" role="status">
              {message}
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  tone: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        {hint ? <p className="truncate text-[11px] text-slate-400">{hint}</p> : null}
      </div>
    </div>
  );
}
