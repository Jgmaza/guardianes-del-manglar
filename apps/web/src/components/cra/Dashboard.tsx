'use client';

import { Button } from '@guardianes/ui';
import {
  Clock3,
  Eye,
  FileText,
  Inbox,
  Info,
  MapPin,
  RefreshCw,
  Siren,
  Timer,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createAlert,
  fetchDashboardReports,
  fetchReportEvents,
  patchReportStatus,
  type DashboardReport,
} from '@/lib/api-client';
import { priorityStyle, statusLabel, statusTone, timeAgo } from '@/lib/report-labels';

const GuardianesMap = dynamic(
  () => import('@/components/map/GuardianesMap').then((m) => m.GuardianesMap),
  { ssr: false },
);

const STATUSES = [
  'submitted',
  'geo_processed',
  'under_review',
  'needs_info',
  'accepted',
  'rejected',
  'alerted',
] as const;

export function CraDashboard() {
  const [reports, setReports] = useState<DashboardReport[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selected, setSelected] = useState<DashboardReport | null>(null);
  const [events, setEvents] = useState<Array<{ type: string; createdAt: string; payload?: unknown }>>(
    [],
  );
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchDashboardReports();
      setReports(rows);
      setLoadError(null);
      setSelected((prev) => {
        if (!prev) return rows[0] ?? null;
        return rows.find((r) => r.id === prev.id) ?? rows[0] ?? null;
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selected) {
      setEvents([]);
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
      if (categoryFilter !== 'all' && (r.categoryCode ?? '') !== categoryFilter) return false;
      return true;
    });
  }, [reports, statusFilter, priorityFilter, categoryFilter]);

  const summary = useMemo(() => {
    return {
      total: reports.length,
      pending: reports.filter((r) => r.status === 'submitted' || r.status === 'geo_processed')
        .length,
      underReview: reports.filter((r) => r.status === 'under_review').length,
      alerted: reports.filter((r) => r.hasPreliminaryAlert || r.status === 'alerted').length,
    };
  }, [reports]);

  const categoryOptions = useMemo(() => {
    const codes = reports
      .map((r) => r.categoryCode)
      .filter((c): c is string => Boolean(c));
    return ['all', ...new Set(codes)];
  }, [reports]);

  const runAction = async (action: () => Promise<string>) => {
    try {
      setMessage(await action());
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'La acción falló');
    }
  };

  const now = Date.now();

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={FileText}
          tone="bg-mg-50 text-mg-800"
          label="Reportes"
          value={loading ? '…' : String(summary.total)}
        />
        <Stat
          icon={Timer}
          tone="bg-amber-100 text-amber-700"
          label="En revisión"
          value={String(summary.underReview)}
        />
        <Stat
          icon={TriangleAlert}
          tone="bg-red-100 text-red-600"
          label="Con alerta"
          value={String(summary.alerted)}
        />
        <Stat
          icon={Inbox}
          tone="bg-sky-100 text-sky-700"
          label="Sin revisar"
          value={String(summary.pending)}
        />
      </section>
      {loadError ? (
        <p
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
          role="alert"
        >
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {loadError}
        </p>
      ) : null}

      <div className="grid items-stretch gap-4 lg:grid-cols-[1.55fr_1fr] lg:gap-5">
        <section className="flex min-w-0 flex-col">
          <GuardianesMap
            mode="overview"
            reports={filtered}
            showCraPolygons
            showInvemarPolygons
            className="flex-1"
            mapClassName="h-[320px] sm:h-[380px] lg:h-[520px]"
          />
        </section>

        <section className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:min-h-0 lg:h-full lg:max-h-[720px]">
          <div className="border-b border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Inbox className="h-4 w-4 text-mg-800" aria-hidden />
                Bandeja de reportes
              </h2>
              <span className="rounded-full bg-mg-900 px-2.5 py-0.5 text-xs font-bold text-white">
                {filtered.length}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Filter
                label="Estado"
                value={statusFilter}
                onChange={setStatusFilter}
                options={['all', ...STATUSES]}
                format={statusLabel}
              />
              <Filter
                label="Prioridad"
                value={priorityFilter}
                onChange={setPriorityFilter}
                options={['all', 'Alto', 'Medio', 'Bajo']}
                format={(v) => priorityStyle(v).label}
              />
              <Filter
                label="Categoría"
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categoryOptions}
              />
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-3">
            {filtered.length === 0 && !loading ? (
              <p className="rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                {reports.length === 0
                  ? 'Aún no hay reportes ciudadanos. Los que lleguen desde la app o WhatsApp aparecerán aquí.'
                  : 'No hay reportes con estos filtros.'}
              </p>
            ) : null}
            {filtered.map((report) => {
              const pri = priorityStyle(report.priorityHint);
              const active = selected?.id === report.id;
              return (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => {
                    setSelected(report);
                    if (window.innerWidth < 1024) {
                      document.getElementById('detalle-reporte')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  aria-pressed={active}
                  style={{ borderLeftColor: pri.color }}
                  className={`w-full rounded-xl border border-l-4 bg-white p-3 text-left shadow-sm transition hover:shadow-md ${
                    active ? 'border-mg-600 ring-2 ring-mg-400/40' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded border px-2 py-0.5 text-[11px] font-bold ${pri.badge}`}>
                      {pri.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock3 className="h-3 w-3" aria-hidden />
                      {timeAgo(report.receivedAt, now)}
                    </span>
                  </div>
                  <p className="mt-2 font-[family-name:var(--font-mono)] text-sm font-bold text-slate-900">
                    {report.trackingCode}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{report.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    {report.categoryLabel ?? report.categoryCode ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                        {report.categoryLabel ?? report.categoryCode}
                      </span>
                    ) : null}
                    {report.dominantSpecies ? (
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800">
                        {report.dominantSpecies}
                      </span>
                    ) : null}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                      {report.evidenceCount} evidencia(s)
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                    <span className="flex items-center gap-1 font-[family-name:var(--font-mono)] text-[11px] text-slate-500">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusTone(report.status)}`}
                    >
                      {statusLabel(report.status)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {selected ? (
        <section
          id="detalle-reporte"
          className="grid scroll-mt-4 gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1.4fr_1fr]"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-[family-name:var(--font-mono)] text-xl font-bold text-slate-900">
                {selected.trackingCode}
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusTone(selected.status)}`}
              >
                {statusLabel(selected.status)}
              </span>
              <span
                className={`rounded border px-2 py-0.5 text-xs font-bold ${priorityStyle(selected.priorityHint).badge}`}
              >
                Prioridad {priorityStyle(selected.priorityHint).label}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{selected.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm md:grid-cols-3">
              {(
                [
                  ['Canal', selected.channel],
                  ['Categoría', selected.categoryLabel ?? selected.categoryCode ?? '—'],
                  ['Observado', new Date(selected.observedAt).toLocaleString('es-CO')],
                  ['Recibido', new Date(selected.receivedAt).toLocaleString('es-CO')],
                  [
                    'Ubicación',
                    `${selected.location.latitude.toFixed(4)}, ${selected.location.longitude.toFixed(4)}`,
                  ],
                  ['Fuente ubicación', selected.location.source],
                  ['Prioridad C.R.A.', selected.priorityHint ?? 'sin cobertura'],
                  [
                    'Zona / UH',
                    `${selected.zoneHydro ?? '—'}${selected.unitHydro ? ` / ${selected.unitHydro}` : ''}`,
                  ],
                  ['Especie (INVEMAR)', selected.dominantSpecies ?? 'sin cobertura manglar'],
                  [
                    'Zonif. manejo',
                    `${selected.managementZone ?? '—'}${selected.locality ? ` · ${selected.locality}` : ''}`,
                  ],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 rounded-lg bg-slate-50 p-3">
              <h3 className="text-sm font-bold text-slate-900">Evidencias</h3>
              <p className="text-sm text-slate-600">
                {selected.evidenceCount} evidencia(s) adjunta(s).
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Historial / verificaciones</h3>
              <ol className="mt-2 space-y-2 border-l-2 border-mg-100 pl-4 text-xs text-slate-600">
                {events.map((e, idx) => (
                  <li key={`${e.type}-${idx}`} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-mg-600" />
                    <span className="font-semibold text-slate-800">{statusLabel(e.type)}</span> ·{' '}
                    {new Date(e.createdAt).toLocaleString('es-CO')}
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-auto flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  runAction(async () => {
                    await patchReportStatus(selected.id, 'under_review', 'triage CRA');
                    return 'Reporte marcado en revisión.';
                  })
                }
              >
                <Eye className="h-4 w-4" aria-hidden />
                Marcar en revisión
              </Button>
              <Button
                variant="secondary"
                className="border-red-600! text-red-700! hover:bg-red-50!"
                onClick={() =>
                  runAction(async () => {
                    await createAlert(
                      selected.id,
                      'Alerta preliminar',
                      'Revisión inicial desde dashboard C.R.A.',
                    );
                    return 'Alerta preliminar creada (no es autorización).';
                  })
                }
              >
                <Siren className="h-4 w-4" aria-hidden />
                Crear alerta preliminar
              </Button>
              <Button variant="secondary" onClick={() => void refresh()}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                Refrescar
              </Button>
            </div>
            {message ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800" role="status">
                {message}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Stat({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: LucideIcon;
  tone: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
  format = (v) => v,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  format?: (v: string) => string;
}) {
  return (
    <label className="min-w-0 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {label}
      <select
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-normal normal-case tracking-normal text-slate-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt === 'all' ? 'Todos' : format(opt)}
          </option>
        ))}
      </select>
    </label>
  );
}
