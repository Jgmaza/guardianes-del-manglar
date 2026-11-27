'use client';

import { Button } from '@guardianes/ui';
import { useState } from 'react';
import { trackReport } from '@/lib/api-client';
import { listPendingReports } from '@/lib/offline/db';
import { syncPendingReports } from '@/lib/offline/sync';

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
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-5">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">Consulta tu reporte</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Usa el código y el secreto. No necesitamos tu nombre ni teléfono.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Código
            <input
              className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2"
              value={code}
              onChange={(e) => setCode(e.target.value.trim().toUpperCase())}
              placeholder="GDM-XXXXXXXX"
            />
          </label>
          <label className="text-sm">
            Secreto
            <input
              className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2"
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
            Consultar estado
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await syncPendingReports();
              await refreshLocal();
            }}
          >
            Reintentar sincronización local
          </Button>
          <Button variant="secondary" onClick={() => void refreshLocal()}>
            Ver cola de este dispositivo
          </Button>
        </div>
        {error ? <p className="mt-3 text-sm text-amber-200">{error}</p> : null}
      </div>

      {view ? (
        <article className="rounded-2xl border border-white/10 bg-[var(--panel)] p-5">
          <h3 className="font-[family-name:var(--font-display)] text-xl">{view.trackingCode}</h3>
          <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            <div>
              <dt className="text-[var(--muted)]">Estado</dt>
              <dd>{view.status}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Categoría</dt>
              <dd>{view.categoryLabel ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Observado</dt>
              <dd>{new Date(view.observedAt).toLocaleString('es-CO')}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Recibido por el sistema</dt>
              <dd>{new Date(view.receivedAt).toLocaleString('es-CO')}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Evidencias</dt>
              <dd>{view.evidenceCount}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Alerta preliminar</dt>
              <dd>{view.hasPreliminaryAlert ? 'Sí' : 'No'}</dd>
            </div>
          </dl>
          <h4 className="mt-4 text-sm font-semibold">Historial</h4>
          <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
            {view.events.map((e) => (
              <li key={`${e.type}-${e.createdAt}`}>
                {e.type} · {new Date(e.createdAt).toLocaleString('es-CO')}
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {localPending.length > 0 ? (
        <article className="rounded-2xl border border-amber-500/30 bg-[var(--panel)] p-5">
          <h3 className="text-lg font-semibold">Cola local (este dispositivo)</h3>
          <p className="text-xs text-amber-100">
            Los ítems en `pending`/`error` aún no están confirmados ante el servidor/C.R.A.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {localPending.map((row) => (
              <li key={row.clientReportId}>
                {row.clientReportId.slice(0, 8)}… · <strong>{row.status}</strong>
                {row.trackingCode ? ` · ${row.trackingCode}` : ''}
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  );
}
