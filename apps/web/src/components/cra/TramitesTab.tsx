'use client';

import { Button } from '@guardianes/ui';
import {
  CheckCircle2,
  Clock3,
  Eye,
  FileWarning,
  MapPin,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { patchReportStatus, type DashboardReport } from '@/lib/api-client';
import {
  isOpenReport,
  priorityStyle,
  statusLabel,
  statusTone,
  timeAgo,
} from '@/lib/report-labels';

function canApprove(status: string): boolean {
  return (
    status === 'geo_processed' ||
    status === 'under_review' ||
    status === 'submitted' ||
    status === 'needs_info'
  );
}

function needsReviewBeforeAccept(status: string): boolean {
  return status === 'submitted' || status === 'needs_info';
}

function canReject(status: string): boolean {
  return isOpenReport(status) && status !== 'alerted';
}

function canRequestInfo(status: string): boolean {
  return status === 'submitted' || status === 'geo_processed' || status === 'under_review';
}

/** Lista de trámites web para el panel derecho (mismo mapa). */
export function TramitesList({
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

  const webReports = useMemo(
    () =>
      reports
        .filter((r) => r.channel === 'pwa')
        .slice()
        .sort(
          (a, b) =>
            new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
        ),
    [reports],
  );

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
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-600">
        Registros web · clic para ubicar en el mapa · aprobar desde la tarjeta
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-3">
        {webReports.length === 0 && !loading ? (
          <p className="rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            Aún no hay registros web. Los envíos desde /reportar aparecerán aquí.
          </p>
        ) : null}

        {webReports.map((report) => {
          const pri = priorityStyle(report.priorityHint);
          const active = selectedId === report.id;
          const busy = busyId === report.id;
          return (
            <article
              key={report.id}
              className={`rounded-xl border border-l-4 bg-white p-3 shadow-sm transition ${
                active ? 'border-mg-600 ring-2 ring-mg-400/40' : 'border-slate-200'
              }`}
              style={{ borderLeftColor: '#2563eb' }}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => onSelect(report)}
                aria-pressed={active}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                    Web
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
                  <span className={`rounded border px-1.5 py-0.5 font-bold ${pri.badge}`}>
                    {pri.label}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 font-bold ${statusTone(report.status)}`}>
                    {statusLabel(report.status)}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1 font-[family-name:var(--font-mono)] text-[11px] text-slate-500">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}
                </p>
              </button>

              {isOpenReport(report.status) && report.status !== 'alerted' ? (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  {canApprove(report.status) && report.status !== 'under_review' ? (
                    <Button
                      disabled={busy}
                      onClick={() =>
                        void runAction(report.id, async () => {
                          await patchReportStatus(report.id, 'under_review', 'toma de trámite CRA');
                          return 'En revisión.';
                        })
                      }
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden />
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
                          return 'Trámite aprobado.';
                        })
                      }
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
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
                          return 'Se pidió información.';
                        })
                      }
                    >
                      <FileWarning className="h-3.5 w-3.5" aria-hidden />
                      Info
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
                          return 'Rechazado.';
                        })
                      }
                    >
                      <XCircle className="h-3.5 w-3.5" aria-hidden />
                      Rechazar
                    </Button>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  Cerrado · {statusLabel(report.status)}
                </p>
              )}
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
