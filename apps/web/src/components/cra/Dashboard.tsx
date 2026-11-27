'use client';

import { Button } from '@guardianes/ui';
import {
  BellRing,
  Bird,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  FileWarning,
  Info,
  MapPin,
  Microscope,
  OctagonAlert,
  RefreshCw,
  Siren,
  Timer,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BiodiversidadList } from '@/components/cra/BiodiversidadList';
import { TramitesList } from '@/components/cra/TramitesTab';
import {
  createAlert,
  fetchDashboardReports,
  fetchReportEvents,
  patchReportStatus,
  type DashboardReport,
} from '@/lib/api-client';
import {
  impactRank,
  isAvistamiento,
  isOpenReport,
  priorityStyle,
  statusLabel,
  statusTone,
  timeAgo,
} from '@/lib/report-labels';

const GuardianesMap = dynamic(
  () => import('@/components/map/GuardianesMap').then((m) => m.GuardianesMap),
  { ssr: false },
);

type PanelTab = 'alertas' | 'biodiversidad' | 'tramites';

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
  const [tab, setTab] = useState<PanelTab>('alertas');
  const [reports, setReports] = useState<DashboardReport[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selected, setSelected] = useState<DashboardReport | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [focusToken, setFocusToken] = useState(0);
  const [events, setEvents] = useState<Array<{ type: string; createdAt: string; payload?: unknown }>>(
    [],
  );
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const modalTimerRef = useRef<number | null>(null);

  const denunciaReports = useMemo(
    () => reports.filter((r) => !isAvistamiento(r.categoryCode)),
    [reports],
  );

  const webTramites = useMemo(
    () => denunciaReports.filter((r) => r.channel === 'pwa'),
    [denunciaReports],
  );

  const bioReports = useMemo(
    () => reports.filter((r) => isAvistamiento(r.categoryCode)),
    [reports],
  );

  const pendingTramites = useMemo(
    () =>
      webTramites.filter(
        (r) =>
          r.status === 'submitted' ||
          r.status === 'geo_processed' ||
          r.status === 'needs_info' ||
          r.status === 'under_review',
      ).length,
    [webTramites],
  );

  const pendingBio = useMemo(
    () => bioReports.filter((r) => r.status !== 'accepted' && r.status !== 'rejected').length,
    [bioReports],
  );

  const closeDetail = useCallback(() => setDetailOpen(false), []);

  /** Click en listado (o marcador): centra el mapa; en Alertas abre modal */
  const openReport = useCallback(
    (report: DashboardReport, openModal = true) => {
      setSelected(report);
      setFocusToken((n) => n + 1);
      setMessage(null);
      document.getElementById('mapa-cra')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (modalTimerRef.current) window.clearTimeout(modalTimerRef.current);
      if (openModal) {
        modalTimerRef.current = window.setTimeout(() => setDetailOpen(true), 550);
      } else {
        setDetailOpen(false);
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchDashboardReports();
      setReports(rows);
      setLoadError(null);
      setSelected((prev) => (prev ? rows.find((r) => r.id === prev.id) ?? null : null));
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
    return () => {
      if (modalTimerRef.current) window.clearTimeout(modalTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!selected || !detailOpen) {
      setEvents([]);
      return;
    }
    void fetchReportEvents(selected.id)
      .then((data) => setEvents(data as typeof events))
      .catch(() => setEvents([]));
  }, [selected, detailOpen]);

  useEffect(() => {
    if (!detailOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetail();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [detailOpen, closeDetail]);

  const filteredAlertas = useMemo(() => {
    return denunciaReports
      .filter((r) => {
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (priorityFilter === 'none' && r.priorityHint) return false;
        if (
          priorityFilter !== 'all' &&
          priorityFilter !== 'none' &&
          (r.priorityHint ?? '') !== priorityFilter
        ) {
          return false;
        }
        if (categoryFilter !== 'all' && (r.categoryCode ?? '') !== categoryFilter) return false;
        return true;
      })
      .slice()
      .sort((a, b) => {
        const byImpact = impactRank(a) - impactRank(b);
        if (byImpact !== 0) return byImpact;
        return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
      });
  }, [denunciaReports, statusFilter, priorityFilter, categoryFilter]);

  /** Mapa siempre visible: muestra la lista de la pestaña activa. */
  const mapReports =
    tab === 'tramites' ? webTramites : tab === 'biodiversidad' ? bioReports : filteredAlertas;

  const summary = useMemo(() => {
    if (tab === 'tramites') {
      const pending = webTramites.filter(
        (r) =>
          r.status === 'submitted' ||
          r.status === 'geo_processed' ||
          r.status === 'needs_info',
      ).length;
      const review = webTramites.filter((r) => r.status === 'under_review').length;
      const accepted = webTramites.filter((r) => r.status === 'accepted').length;
      const rejected = webTramites.filter((r) => r.status === 'rejected').length;
      return {
        kind: 'tramites' as const,
        pending,
        review,
        accepted,
        rejected,
        total: webTramites.length,
      };
    }
    if (tab === 'biodiversidad') {
      const pending = bioReports.filter(
        (r) => r.status !== 'accepted' && r.status !== 'rejected',
      ).length;
      const validated = bioReports.filter((r) => r.status === 'accepted').length;
      const species = new Set(
        bioReports.flatMap((r) => {
          const line = (r.description ?? '').split('\n').find((l) => l.startsWith('Especies:'));
          if (!line) return [] as string[];
          return line
            .replace(/^Especies:\s*/i, '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }),
      );
      return {
        kind: 'biodiversidad' as const,
        total: bioReports.length,
        pending,
        validated,
        species: species.size,
      };
    }
    const open = denunciaReports.filter((r) => isOpenReport(r.status));
    const critical = open.filter(
      (r) =>
        r.priorityHint === 'Alto' || r.hasPreliminaryAlert || r.status === 'alerted',
    );
    const underReview = denunciaReports.filter((r) => r.status === 'under_review').length;
    const resolved = denunciaReports.filter(
      (r) => r.status === 'accepted' || r.status === 'rejected',
    ).length;
    return {
      kind: 'alertas' as const,
      open: open.length,
      critical: critical.length,
      underReview,
      resolvedPct:
        denunciaReports.length === 0
          ? 0
          : Math.round((resolved / denunciaReports.length) * 100),
      resolved,
      total: denunciaReports.length,
    };
  }, [tab, denunciaReports, webTramites, bioReports]);

  const categoryOptions = useMemo(() => {
    const codes = denunciaReports
      .map((r) => r.categoryCode)
      .filter((c): c is string => Boolean(c));
    return ['all', ...new Set(codes)];
  }, [denunciaReports]);

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
        {summary.kind === 'alertas' ? (
          <>
            <Stat
              icon={BellRing}
              tone="bg-amber-100 text-amber-800"
              label="Activos"
              hint="Sin cerrar"
              value={loading ? '…' : String(summary.open)}
            />
            <Stat
              icon={OctagonAlert}
              tone="bg-red-100 text-red-700"
              label="Críticos"
              hint="Prioridad alta o alerta"
              value={String(summary.critical)}
            />
            <Stat
              icon={Timer}
              tone="bg-mg-50 text-mg-800"
              label="En atención"
              hint="En revisión C.R.A."
              value={String(summary.underReview)}
            />
            <Stat
              icon={CheckCircle2}
              tone="bg-emerald-100 text-emerald-800"
              label="Resolución"
              hint={`${summary.resolved} de ${summary.total}`}
              value={`${summary.resolvedPct}%`}
            />
          </>
        ) : summary.kind === 'biodiversidad' ? (
          <>
            <Stat
              icon={Bird}
              tone="bg-emerald-100 text-emerald-800"
              label="Registros"
              hint="Fotos y avistamientos"
              value={loading ? '…' : String(summary.total)}
            />
            <Stat
              icon={Microscope}
              tone="bg-amber-100 text-amber-800"
              label="Por validar"
              hint="Revisión de biólogos"
              value={String(summary.pending)}
            />
            <Stat
              icon={CheckCircle2}
              tone="bg-mg-50 text-mg-800"
              label="Validados"
              hint="Aceptados C.R.A."
              value={String(summary.validated)}
            />
            <Stat
              icon={Bird}
              tone="bg-lime-100 text-lime-800"
              label="Especies"
              hint="Etiquetas distintas"
              value={String(summary.species)}
            />
          </>
        ) : (
          <>
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
              icon={CheckCircle2}
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
          </>
        )}
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
        <section id="mapa-cra" className="flex min-w-0 flex-col scroll-mt-4">
          <GuardianesMap
            mode="overview"
            reports={mapReports}
            focusReportId={selected?.id ?? null}
            focusToken={focusToken}
            onSelectReport={(r) => openReport(r, tab === 'alertas')}
            showCraPolygons
            showInvemarPolygons
            className="flex-1"
            mapClassName="h-[320px] sm:h-[380px] lg:h-[520px]"
          />
        </section>

        <aside className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:min-h-0 lg:h-full lg:max-h-[720px]">
          <div
            className="flex border-b border-slate-200 bg-slate-50"
            role="tablist"
            aria-label="Bandeja del mapa"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'alertas'}
              onClick={() => {
                setTab('alertas');
                setSelected(null);
                setDetailOpen(false);
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-4 px-1.5 py-3 text-sm font-semibold transition sm:px-2 ${
                tab === 'alertas'
                  ? 'border-emerald-600 bg-white text-mg-900'
                  : 'border-transparent text-slate-600 hover:bg-white'
              }`}
            >
              <BellRing className="h-4 w-4" aria-hidden />
              Alertas
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'biodiversidad'}
              onClick={() => {
                setTab('biodiversidad');
                setSelected(null);
                setDetailOpen(false);
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-4 px-1.5 py-3 text-sm font-semibold transition sm:px-2 ${
                tab === 'biodiversidad'
                  ? 'border-emerald-600 bg-white text-mg-900'
                  : 'border-transparent text-slate-600 hover:bg-white'
              }`}
            >
              <Bird className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Biodiversidad</span>
              <span className="sm:hidden">Bio</span>
              {pendingBio > 0 ? (
                <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[11px] font-bold text-white">
                  {pendingBio}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'tramites'}
              onClick={() => {
                setTab('tramites');
                setSelected(null);
                setDetailOpen(false);
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-4 px-1.5 py-3 text-sm font-semibold transition sm:px-2 ${
                tab === 'tramites'
                  ? 'border-emerald-600 bg-white text-mg-900'
                  : 'border-transparent text-slate-600 hover:bg-white'
              }`}
            >
              <ClipboardList className="h-4 w-4" aria-hidden />
              Trámites
              {pendingTramites > 0 ? (
                <span className="rounded-full bg-blue-700 px-2 py-0.5 text-[11px] font-bold text-white">
                  {pendingTramites}
                </span>
              ) : null}
            </button>
          </div>

          {tab === 'alertas' ? (
            <>
              <div className="border-b border-slate-100 px-4 py-2">
                <p className="text-xs text-slate-600">
                  Ordenadas por impacto · clic para ubicar en el mapa
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
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
                    options={['all', 'Alto', 'Medio', 'Bajo', 'none']}
                    format={(v) => (v === 'none' ? 'Sin cobertura' : priorityStyle(v).label)}
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
                {filteredAlertas.length === 0 && !loading ? (
                  <p className="rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                    {reports.length === 0
                      ? 'Aún no hay reportes ciudadanos. Los que lleguen desde la app o WhatsApp aparecerán aquí.'
                      : 'No hay reportes con estos filtros.'}
                  </p>
                ) : null}
                {filteredAlertas.map((report) => {
                  const pri = priorityStyle(report.priorityHint);
                  const active = selected?.id === report.id;
                  return (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => openReport(report)}
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
            </>
          ) : tab === 'biodiversidad' ? (
            <BiodiversidadList
              reports={reports}
              loading={loading}
              selectedId={selected?.id ?? null}
              onSelect={(r) => openReport(r, false)}
              onRefresh={refresh}
            />
          ) : (
            <TramitesList
              reports={webTramites}
              loading={loading}
              selectedId={selected?.id ?? null}
              onSelect={(r) => openReport(r, false)}
              onRefresh={refresh}
            />
          )}
        </aside>
      </div>

      {detailOpen && selected ? (
        <div
          className="fixed inset-0 z-[2000] flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-6"
          role="presentation"
          onClick={closeDetail}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-reporte-title"
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="detalle-reporte-title"
                    className="font-[family-name:var(--font-mono)] text-xl font-bold text-slate-900"
                  >
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
                <p className="mt-1 text-xs text-slate-500">
                  Mapa centrado en{' '}
                  <span className="font-[family-name:var(--font-mono)]">
                    {selected.location.latitude.toFixed(4)}, {selected.location.longitude.toFixed(4)}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Cerrar detalle"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="grid flex-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="text-sm text-slate-700">{selected.description}</p>
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
                  {isOpenReport(selected.status) && selected.status !== 'alerted' ? (
                    <>
                      <Button
                        onClick={() =>
                          runAction(async () => {
                            await patchReportStatus(selected.id, 'under_review', 'triage CRA');
                            return 'Reporte marcado en revisión.';
                          })
                        }
                      >
                        <Eye className="h-4 w-4" aria-hidden />
                        En revisión
                      </Button>
                      <Button
                        className="bg-emerald-700! hover:bg-emerald-800!"
                        onClick={() =>
                          runAction(async () => {
                            if (
                              selected.status === 'submitted' ||
                              selected.status === 'needs_info'
                            ) {
                              await patchReportStatus(selected.id, 'under_review', 'pre-aprobación');
                            }
                            await patchReportStatus(selected.id, 'accepted', 'aprobado por C.R.A.');
                            return 'Trámite aprobado.';
                          })
                        }
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                        Aprobar
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          runAction(async () => {
                            await patchReportStatus(
                              selected.id,
                              'needs_info',
                              'C.R.A. solicita más información',
                            );
                            return 'Se pidió más información.';
                          })
                        }
                      >
                        <FileWarning className="h-4 w-4" aria-hidden />
                        Pedir info
                      </Button>
                      <Button
                        variant="secondary"
                        className="border-red-600! text-red-700! hover:bg-red-50!"
                        onClick={() =>
                          runAction(async () => {
                            await patchReportStatus(selected.id, 'rejected', 'rechazado por C.R.A.');
                            return 'Trámite rechazado.';
                          })
                        }
                      >
                        <XCircle className="h-4 w-4" aria-hidden />
                        Rechazar
                      </Button>
                    </>
                  ) : null}
                  <Button
                    variant="secondary"
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
                    Alerta preliminar
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
            </div>
          </div>
        </div>
      ) : null}
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
