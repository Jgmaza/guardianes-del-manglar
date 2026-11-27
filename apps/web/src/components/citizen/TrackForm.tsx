'use client';

import { Button } from '@guardianes/ui';
import { ClipboardList, RefreshCw, Search, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { trackReport } from '@/lib/api-client';
import { listPendingReports } from '@/lib/offline/db';
import { syncPendingReports } from '@/lib/offline/sync';
import { statusLabel, statusTone } from '@/lib/report-labels';

const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const INPUT =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900 placeholder:text-slate-400';

type TrackView = {
  trackingCode: string;
  status: string;
  categoryLabel: string | null;
  observedAt: string;
  receivedAt: string;
  evidenceCount: number;
  hasPreliminaryAlert: boolean;
  events: Array<{ type: string; createdAt: string }>;
};

export function TrackForm() {
  const [code, setCode] = useState('');
  const [secret, setSecret] = useState('');
  const [view, setView] = useState<TrackView | null>(null);
  const [localPending, setLocalPending] = useState<
    Array<{ clientReportId: string; status: string; trackingCode?: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshLocal = async () => {
    const rows = await listPendingReports();
    setLocalPending(
      rows.map((r) => ({
        clientReportId: r.clientReportId,
        status: r.status,
        trackingCode: r.trackingCode,
      })),
    );
  };

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <div className={`${CARD} p-5`}>
        <h2 className="text-xl font-bold text-slate-900">Consulta tu reporte</h2>
        <p className="mt-2 text-sm text-slate-600">
          Usa el código y el secreto. No necesitamos tu nombre ni teléfono.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-800">
            Código
            <input
              className={`${INPUT} font-[family-name:var(--font-mono)]`}
              value={code}
              onChange={(e) => setCode(e.target.value.trim().toUpperCase())}
              placeholder="GDM-XXXXXXXX"
            />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            Secreto
            <input
              className={INPUT}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              type="password"
              placeholder="Se mostró al crear el reporte"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const data = (await trackReport(code, secret)) as TrackView;
                setView(data);
              } catch (err) {
                setView(null);
                setError(err instanceof Error ? err.message : 'Consulta fallida');
              } finally {
                setBusy(false);
              }
            }}
          >
            <Search className="h-4 w-4" aria-hidden />
            Consultar estado
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await syncPendingReports();
              await refreshLocal();
            }}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Reintentar sincronización local
          </Button>
          <Button variant="secondary" onClick={() => void refreshLocal()}>
            <Smartphone className="h-4 w-4" aria-hidden />
            Ver cola de este dispositivo
          </Button>
        </div>
        {error ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="space-y-5">
        {view ? (
          <article className={`${CARD} border-l-4 border-l-mg-600 p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-[family-name:var(--font-mono)] text-lg font-bold text-slate-900">
                {view.trackingCode}
              </h3>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusTone(view.status)}`}
              >
                {statusLabel(view.status)}
              </span>
            </div>
            <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
              {[
                ['Categoría', view.categoryLabel ?? '—'],
                ['Observado', new Date(view.observedAt).toLocaleString('es-CO')],
                ['Recibido por el sistema', new Date(view.receivedAt).toLocaleString('es-CO')],
                ['Evidencias', String(view.evidenceCount)],
                ['Alerta preliminar', view.hasPreliminaryAlert ? 'Sí' : 'No'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
            <h4 className="mt-4 text-sm font-bold text-slate-900">Historial</h4>
            <ol className="mt-2 space-y-2 border-l-2 border-mg-100 pl-4 text-sm text-slate-600">
              {view.events.map((e) => (
                <li key={`${e.type}-${e.createdAt}`} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-mg-600" />
                  <span className="font-medium text-slate-800">{statusLabel(e.type)}</span> ·{' '}
                  {new Date(e.createdAt).toLocaleString('es-CO')}
                </li>
              ))}
            </ol>
          </article>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            <ClipboardList className="h-8 w-8 text-slate-400" aria-hidden />
            El estado de tu reporte aparecerá aquí.
          </div>
        )}

        {localPending.length > 0 ? (
          <article className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <h3 className="text-base font-bold text-amber-900">Cola local (este dispositivo)</h3>
            <p className="text-xs text-amber-800">
              Los ítems en `pending`/`error` aún no están confirmados ante el servidor/C.R.A.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-800">
              {localPending.map((row) => (
                <li
                  key={row.clientReportId}
                  className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2"
                >
                  <span className="font-[family-name:var(--font-mono)] text-xs">
                    {row.clientReportId.slice(0, 8)}…
                  </span>
                  <strong>{row.status}</strong>
                  {row.trackingCode ? (
                    <span className="font-[family-name:var(--font-mono)] text-xs">
                      {row.trackingCode}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </article>
        ) : null}
      </div>
    </section>
  );
}
