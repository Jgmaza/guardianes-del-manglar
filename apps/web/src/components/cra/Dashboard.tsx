'use client';

import { Button } from '@guardianes/ui';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import {
  createAlert,
  fetchReportEvents,
  loadFixtureReports,
  patchReportStatus,
  type FixtureReport,
} from '@/lib/api-client';

const GuardianesMap = dynamic(
  () => import('@/components/map/GuardianesMap').then((m) => m.GuardianesMap),
  { ssr: false },
);

const STATUSES = [
  'submitted',
  'under_review',
  'needs_info',
  'accepted',
  'rejected',
  'alerted',
] as const;

export function CraDashboard() {
  const [reports, setReports] = useState<FixtureReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selected, setSelected] = useState<FixtureReport | null>(null);
  const [events, setEvents] = useState<Array<{ type: string; createdAt: string; payload?: unknown }>>(
    [],
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadFixtureReports().then((rows) => {
      setReports(rows);
      setSelected(rows[0] ?? null);
    });
  }, []);

  useEffect(() => {
    if (!selected || selected.id.startsWith('fixture-')) {
      setEvents([
        {
          type: 'fixture_note',
          createdAt: new Date().toISOString(),
          payload: { note: 'Historial de ejemplo — no es un expediente real.' },
        },
      ]);
      return;
    }
    void fetchReportEvents(selected.id)
      .then((data) => setEvents(data as typeof events))
      .catch(() => setEvents([]));
  }, [selected]);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && (r.priorityHint ?? '') !== priorityFilter) return false;
      if (categoryFilter !== 'all' && r.categoryCode !== categoryFilter) return false;
      return true;
    });
  }, [reports, statusFilter, priorityFilter, categoryFilter]);

  const summary = useMemo(() => {
    return {
      total: reports.length,
      underReview: reports.filter((r) => r.status === 'under_review').length,
      alerted: reports.filter((r) => r.hasPreliminaryAlert || r.status === 'alerted').length,
      fixtureNote: 'Incluye fixtures de desarrollo claramente marcados.',
    };
  }, [reports]);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-4">
        <Stat label="Reportes (vista)" value={String(summary.total)} />
        <Stat label="En revisión" value={String(summary.underReview)} />
        <Stat label="Con alerta" value={String(summary.alerted)} />
        <Stat label="Fuente" value="FIXTURE + API" />
      </section>
      <p className="text-xs text-amber-100">{summary.fixtureNote}</p>

      <section className="grid gap-3 rounded-2xl border border-white/10 bg-[var(--panel)] p-4 md:grid-cols-3">
        <Filter
          label="Estado"
          value={statusFilter}
          onChange={setStatusFilter}
          options={['all', ...STATUSES]}
        />
        <Filter
          label="Prioridad (hint fixture/capa)"
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={['all', 'Alto', 'Medio', 'Bajo']}
        />
        <Filter
          label="Categoría"
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={['all', ...new Set(reports.map((r) => r.categoryCode))]}
        />
      </section>

      <GuardianesMap mode="overview" reports={filtered} showCraPolygons />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          {filtered.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => setSelected(report)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                selected?.id === report.id
                  ? 'border-[var(--gdm-tide)] bg-white/10'
                  : 'border-white/10 bg-black/20 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <strong>{report.trackingCode}</strong>
                <span className="text-xs text-[var(--muted)]">{report.status}</span>
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">{report.description}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Prioridad hint: {report.priorityHint ?? '—'} · evidencias: {report.evidenceCount}
              </p>
            </button>
          ))}
        </div>

        {selected ? (
          <aside className="space-y-4 rounded-2xl border border-white/10 bg-[var(--panel)] p-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">
              {selected.trackingCode}
            </h2>
            <p className="text-sm">{selected.description}</p>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-[var(--muted)]">Canal</dt>
                <dd>{selected.channel}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Categoría</dt>
                <dd>{selected.categoryLabel}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Observado</dt>
                <dd>{new Date(selected.observedAt).toLocaleString('es-CO')}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Recibido</dt>
                <dd>{new Date(selected.receivedAt).toLocaleString('es-CO')}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Ubicación</dt>
                <dd>
                  {selected.location.latitude.toFixed(4)}, {selected.location.longitude.toFixed(4)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Fuente ubicación</dt>
                <dd>{selected.location.source}</dd>
              </div>
            </dl>

            <div>
              <h3 className="text-sm font-semibold">Evidencias</h3>
              <p className="text-sm text-[var(--muted)]">
                Conteos: {selected.evidenceCount}. Metadatos EXIF/hash se muestran cuando el reporte
                proviene de la API real (no del fixture).
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Historial / verificaciones</h3>
              <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                {events.map((e, idx) => (
                  <li key={`${e.type}-${idx}`}>
                    {e.type} · {new Date(e.createdAt).toLocaleString('es-CO')}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={async () => {
                  if (selected.id.startsWith('fixture-')) {
                    setMessage('Fixture: el cambio de estado se simula solo en esta sesión UI.');
                    setReports((prev) =>
                      prev.map((r) =>
                        r.id === selected.id ? { ...r, status: 'under_review' } : r,
                      ),
                    );
                    setSelected({ ...selected, status: 'under_review' });
                    return;
                  }
                  await patchReportStatus(selected.id, 'under_review', 'triage CRA');
                  setMessage('Estado actualizado en API.');
                }}
              >
                Marcar en revisión
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  if (selected.id.startsWith('fixture-')) {
                    setMessage('Fixture: se marca alerta preliminar solo en UI.');
                    const next = { ...selected, hasPreliminaryAlert: true, status: 'alerted' };
                    setSelected(next);
                    setReports((prev) => prev.map((r) => (r.id === selected.id ? next : r)));
                    return;
                  }
                  await createAlert(
                    selected.id,
                    'Alerta preliminar',
                    'Revisión inicial desde dashboard C.R.A.',
                  );
                  setMessage('Alerta preliminar creada (no es autorización).');
                }}
              >
                Crear alerta preliminar
              </Button>
            </div>
            {message ? <p className="text-xs text-emerald-200">{message}</p> : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl">{value}</p>
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="text-sm">
      {label}
      <select
        className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
