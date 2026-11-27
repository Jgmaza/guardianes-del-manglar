'use client';

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DashboardReport } from '@/lib/api-client';
import { PRIORITY_STYLES } from '@/lib/report-labels';

export type MapMode = 'citizen-pick' | 'overview';

type Props = {
  mode: MapMode;
  reports?: DashboardReport[];
  pick?: { longitude: number; latitude: number } | null;
  onPick?: (point: { longitude: number; latitude: number }) => void;
  /** Selected from the inbox list — centers map + opens popup */
  focusReportId?: string | null;
  focusToken?: number;
  onSelectReport?: (report: DashboardReport) => void;
  showCraPolygons?: boolean;
  showInvemarPolygons?: boolean;
  className?: string;
  mapClassName?: string;
};

const PRIORITY_COLORS: Record<string, string> = {
  Alto: PRIORITY_STYLES.Alto?.color ?? '#dc2626',
  Medio: PRIORITY_STYLES.Medio?.color ?? '#f59e0b',
  Bajo: PRIORITY_STYLES.Bajo?.color ?? '#10b981',
};

const SPECIES_LABELS: Record<string, string> = {
  'A. germinans': 'Mangle negro / salado',
  'C. erectus': 'Mangle zaragoza',
  'R. mangle': 'Mangle rojo',
  'L. racemosa': 'Mangle amarillo',
};

/** INVEMAR intervention level → impact color on the map */
const IMPACT_COLORS: Record<string, string> = {
  Alta: '#dc2626',
  Media: '#f59e0b',
  Baja: '#10b981',
};

function interventionLevel(raw: unknown): 'Alta' | 'Media' | 'Baja' | 'Sin dato' {
  const text = String(raw ?? '');
  if (/alta/i.test(text)) return 'Alta';
  if (/media/i.test(text)) return 'Media';
  if (/baja/i.test(text)) return 'Baja';
  return 'Sin dato';
}

const STATUS_COLORS: Record<string, string> = {
  submitted: '#38bdf8',
  geo_processed: '#22d3ee',
  under_review: '#fbbf24',
  needs_info: '#fb923c',
  accepted: '#4ade80',
  rejected: '#f87171',
  alerted: '#f472b6',
};

function popupShell(title: string, rows: Array<[string, string]>, foot: string) {
  const body = rows
    .map(
      ([k, v]) =>
        `<div style="display:flex;justify-content:space-between;gap:12px;margin:2px 0">
          <span style="opacity:.7">${k}</span><strong>${v}</strong>
        </div>`,
    )
    .join('');
  return `<div style="min-width:200px;font:13px/1.35 system-ui,sans-serif">
    <div style="font-weight:700;margin-bottom:6px">${title}</div>
    ${body}
    <div style="margin-top:8px;font-size:11px;opacity:.65">${foot}</div>
  </div>`;
}

export function GuardianesMap({
  mode,
  reports = [],
  pick,
  onPick,
  focusReportId = null,
  focusToken = 0,
  onSelectReport,
  showCraPolygons: showCraDefault = true,
  showInvemarPolygons: showInvemarDefault = true,
  className = '',
  mapClassName = 'h-[360px] md:h-[480px]',
}: Props) {
  const mapId = useId().replace(/:/g, '');
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const craLayerRef = useRef<import('leaflet').LayerGroup | null>(null);
  const invemarLayerRef = useRef<import('leaflet').LayerGroup | null>(null);
  const reportsLayerRef = useRef<import('leaflet').LayerGroup | null>(null);
  const markersByIdRef = useRef<Map<string, import('leaflet').CircleMarker>>(new Map());
  const onSelectReportRef = useRef(onSelectReport);
  const focusReportIdRef = useRef(focusReportId);
  onSelectReportRef.current = onSelectReport;
  focusReportIdRef.current = focusReportId;

  const [layerCra, setLayerCra] = useState(showCraDefault && mode === 'overview');
  const [layerInvemar, setLayerInvemar] = useState(showInvemarDefault && mode === 'overview');
  const [layerReports, setLayerReports] = useState(true);
  const [ready, setReady] = useState(false);
  const [counts, setCounts] = useState({ cra: 0, invemar: 0 });

  const reportCount = reports.length;
  const reportsKey = useMemo(
    () => reports.map((r) => `${r.id}:${r.status}:${r.priorityHint}:${r.dominantSpecies}`).join('|'),
    [reports],
  );

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const L = await import('leaflet');
      if (cancelled) return;
      const el = document.getElementById(`map-${mapId}`);
      if (!el) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Ciénaga Mallorquín / Puerto Colombia — densest INVEMAR + CRA coverage
      const map = L.map(el, {
        center: [11.04, -74.87],
        zoom: mode === 'overview' ? 12 : 11,
        zoomControl: true,
        maxBounds: [
          [10.55, -75.4],
          [11.2, -74.65],
        ],
        maxBoundsViscosity: 0.6,
      });
      mapRef.current = map;

      // CARTO basemaps now render an "API KEY REQUIRED" watermark and OSM blocks
      // requests without Referer; Esri tiles work keyless.
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap',
          maxZoom: 19,
          referrerPolicy: 'strict-origin-when-cross-origin',
        },
      ).addTo(map);

      const craGroup = L.layerGroup().addTo(map);
      const invemarGroup = L.layerGroup().addTo(map);
      const reportsGroup = L.layerGroup().addTo(map);
      craLayerRef.current = craGroup;
      invemarLayerRef.current = invemarGroup;
      reportsLayerRef.current = reportsGroup;

      if (mode === 'overview') {
        try {
          const craRes = await fetch('/fixtures/cra-priorities-sample.geojson');
          const craJson = await craRes.json();
          const craLayer = L.geoJSON(craJson, {
            style: (feature) => {
              const pri = String(feature?.properties?.Val_Priori ?? 'Bajo');
              const color = PRIORITY_COLORS[pri] ?? '#15803d';
              return {
                color,
                weight: pri === 'Alto' ? 2.5 : 2,
                dashArray: pri === 'Alto' ? undefined : '5 4',
                fillColor: color,
                fillOpacity: pri === 'Alto' ? 0.35 : pri === 'Medio' ? 0.28 : 0.2,
              };
            },
            onEachFeature: (feature, layer) => {
              const p = feature.properties ?? {};
              layer.bindPopup(
                popupShell(
                  `Zona de impacto C.R.A. · ${p.NOMUH ?? p.name ?? 'Unidad'}`,
                  [
                    ['Prioridad', String(p.Val_Priori ?? '—')],
                    ['Zona hidro.', String(p.NOMZH ?? '—')],
                    ['Subzona', String(p.NOMSZH ?? '—')],
                    ['Acción', String(p.AccionGen ?? '—')],
                    ['Escenario', String(p.Escenarios ?? '—')],
                  ],
                  'Cuadrante de prioridad C.R.A. (muestra ~75 de 14 732). No es inventario de manglar.',
                ),
              );
            },
          });
          craGroup.addLayer(craLayer);
          setCounts((c) => ({ ...c, cra: craJson.features?.length ?? 0 }));
        } catch {
          /* keep map usable */
        }

        try {
          const invRes = await fetch('/fixtures/invemar-zonificacion-atlantico.geojson');
          const invJson = await invRes.json();
          const invLayer = L.geoJSON(invJson, {
            style: (feature) => {
              const level = interventionLevel(feature?.properties?.C4_INTRV_1);
              const color = IMPACT_COLORS[level] ?? '#64748b';
              return {
                color,
                weight: 1.25,
                fillColor: color,
                fillOpacity: level === 'Alta' ? 0.5 : level === 'Media' ? 0.4 : 0.32,
              };
            },
            onEachFeature: (feature, layer) => {
              const p = feature.properties ?? {};
              const sp = String(p.COB_SPDOM ?? '');
              const level = interventionLevel(p.C4_INTRV_1);
              layer.bindPopup(
                popupShell(
                  `Impacto manglar · ${p.LOCALIDAD ?? 'Sin localidad'}`,
                  [
                    ['Intervención', String(p.C4_INTRV_1 ?? level)],
                    ['Degradación', String(p.C1_GRADO_1 ?? '—')],
                    ['Uso actual', String(p.USOACTUAL ?? '—')],
                    ['Especie dominante', `${sp || '—'} (${SPECIES_LABELS[sp] ?? '—'})`],
                    ['Zonificación', String(p.ZONIF ?? '—')],
                    ['Conflicto de uso', String(p.C10_CONFLI ?? '—')],
                  ],
                  'INVEMAR SIGMA · color = nivel de intervención (impacto). Citar INVEMAR.',
                ),
              );
            },
          });
          invemarGroup.addLayer(invLayer);
          setCounts((c) => ({ ...c, invemar: invJson.features?.length ?? 0 }));
          try {
            // Focus the dense corridor: Mallorquín → Puerto Colombia → Pradomar
            map.fitBounds(
              L.latLngBounds([
                [11.005, -74.95],
                [11.065, -74.82],
              ]),
              { padding: [24, 24], maxZoom: 13 },
            );
          } catch {
            /* ignore */
          }
        } catch {
          /* keep map usable */
        }
      }

      if (mode === 'citizen-pick') {
        map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
          onPick?.({ latitude: e.latlng.lat, longitude: e.latlng.lng });
        });
      }

      setReady(true);
    }

    void setup();
    return () => {
      cancelled = true;
      setReady(false);
      mapRef.current?.remove();
      mapRef.current = null;
      craLayerRef.current = null;
      invemarLayerRef.current = null;
      reportsLayerRef.current = null;
    };
  }, [mapId, mode, onPick]);

  // Layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const cra = craLayerRef.current;
    const inv = invemarLayerRef.current;
    if (cra) {
      if (layerCra) cra.addTo(map);
      else map.removeLayer(cra);
    }
    if (inv) {
      if (layerInvemar) inv.addTo(map);
      else map.removeLayer(inv);
    }
  }, [layerCra, layerInvemar, ready]);

  // Reports markers (redraw when list changes)
  useEffect(() => {
    const map = mapRef.current;
    const group = reportsLayerRef.current;
    if (!map || !group || !ready) return;

    void (async () => {
      const L = await import('leaflet');
      group.clearLayers();
      markersByIdRef.current.clear();

      for (const report of reports) {
        const statusColor = STATUS_COLORS[report.status] ?? '#38bdf8';
        const marker = L.circleMarker([report.location.latitude, report.location.longitude], {
          radius: 9,
          color: '#ffffff',
          weight: 2,
          fillColor: statusColor,
          fillOpacity: 1,
        });
        marker.bindTooltip(report.trackingCode, {
          permanent: false,
          direction: 'top',
          opacity: 0.95,
        });
        marker.bindPopup(
          popupShell(
            `Reporte ciudadano · ${report.trackingCode}`,
            [
              ['Estado', report.status],
              ['Canal', report.channel],
              ['Prioridad C.R.A.', report.priorityHint ?? 'sin cobertura'],
              ['Zona / UH', `${report.zoneHydro ?? '—'} / ${report.unitHydro ?? '—'}`],
              ['Especie INVEMAR', report.dominantSpecies ?? 'sin cobertura manglar'],
              ['Zonif. manejo', report.managementZone ?? '—'],
              ['Localidad', report.locality ?? '—'],
              ['Evidencias', String(report.evidenceCount)],
            ],
            report.description
              ? String(report.description).slice(0, 160)
              : 'Punto reportado por ciudadanía (PWA/WhatsApp).',
          ),
        );
        marker.on('click', () => {
          onSelectReportRef.current?.(report);
        });
        marker.addTo(group);
        markersByIdRef.current.set(report.id, marker);
      }

      if (pick) {
        L.circleMarker([pick.latitude, pick.longitude], {
          radius: 11,
          color: '#fff',
          fillColor: '#115740',
          fillOpacity: 1,
          weight: 3,
        })
          .bindTooltip('Tu pin', { permanent: true, direction: 'right' })
          .addTo(group);
        map.setView([pick.latitude, pick.longitude], Math.max(map.getZoom(), 12));
      }

      if (layerReports) group.addTo(map);
      else map.removeLayer(group);

      if (mode === 'overview' && !focusReportIdRef.current) {
        try {
          if (reports.length > 0) {
            const latLngs = reports.map(
              (r) => [r.location.latitude, r.location.longitude] as [number, number],
            );
            latLngs.push([11.045, -74.86], [11.02, -74.9]);
            map.fitBounds(L.latLngBounds(latLngs), { padding: [36, 36], maxZoom: 13 });
          }
        } catch {
          /* ignore */
        }
      }
    })();
  }, [ready, reports, reportsKey, pick, layerReports, mode]);

  useEffect(() => {
    const map = mapRef.current;
    const group = reportsLayerRef.current;
    if (!map || !group || !ready) return;
    if (layerReports) group.addTo(map);
    else map.removeLayer(group);
  }, [layerReports, ready]);

  // Inbox list selection → flyTo + popup
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !focusReportId) return;
    const report = reports.find((r) => r.id === focusReportId);
    if (!report) return;

    map.flyTo([report.location.latitude, report.location.longitude], Math.max(map.getZoom(), 14), {
      duration: 0.8,
    });
    const timer = window.setTimeout(() => {
      markersByIdRef.current.get(focusReportId)?.openPopup();
    }, 450);
    return () => window.clearTimeout(timer);
  }, [focusReportId, focusToken, ready, reports, reportsKey]);

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {mode === 'overview' ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs">
          <span className="mr-1 font-bold uppercase tracking-wide text-slate-500">
            Capas
          </span>
          <LayerToggle
            active={layerCra}
            onClick={() => setLayerCra((v) => !v)}
            swatchClass="border-dashed border-orange-500 bg-orange-500/20"
            label={`Zonas impacto C.R.A. (${counts.cra || '…'})`}
          />
          <LayerToggle
            active={layerInvemar}
            onClick={() => setLayerInvemar((v) => !v)}
            swatchClass="border-teal-700 bg-teal-700/50"
            label={`Impacto INVEMAR (${counts.invemar || '…'})`}
          />
          <LayerToggle
            active={layerReports}
            onClick={() => setLayerReports((v) => !v)}
            swatchClass="border-slate-900 bg-sky-400"
            label={`Reportes (${reportCount})`}
          />
        </div>
      ) : null}

      <div id={`map-${mapId}`} className={`w-full ${mapClassName}`} />

      {mode === 'overview' ? (
        <div className="grid gap-4 border-t border-slate-200 bg-white p-4 text-xs md:grid-cols-3">
          <LegendBlock title="1. Zonas de impacto C.R.A. (cuadrantes)">
            <p className="mb-2 text-slate-500">
              Prioridad de conservación por unidad hidrográfica. Rojo = más crítico.
            </p>
            <SwatchRow color={PRIORITY_COLORS.Alto ?? '#dc2626'} label="Impacto alto" />
            <SwatchRow color={PRIORITY_COLORS.Medio ?? '#f59e0b'} label="Impacto medio" dashed />
            <SwatchRow color={PRIORITY_COLORS.Bajo ?? '#10b981'} label="Impacto bajo" dashed />
          </LegendBlock>

          <LegendBlock title="2. Impacto manglar INVEMAR">
            <p className="mb-2 text-slate-500">
              Color = intervención observada (tala, basura, etc.). Clic para especie y uso.
            </p>
            <SwatchRow color={IMPACT_COLORS.Alta ?? '#dc2626'} label="Alta intervención" />
            <SwatchRow color={IMPACT_COLORS.Media ?? '#f59e0b'} label="Media intervención" />
            <SwatchRow color={IMPACT_COLORS.Baja ?? '#10b981'} label="Baja intervención" />
          </LegendBlock>

          <LegendBlock title="3. Reportes ciudadanos (puntos)">
            <p className="mb-2 text-slate-500">
              Cada punto es un reporte. Color = estado del expediente. Clic para ver
              prioridad/zona/especie del join.
            </p>
            <SwatchRow color={STATUS_COLORS.submitted ?? '#38bdf8'} label="submitted / recibido" round />
            <SwatchRow color={STATUS_COLORS.geo_processed ?? '#22d3ee'} label="geo_processed" round />
            <SwatchRow color={STATUS_COLORS.under_review ?? '#fbbf24'} label="under_review" round />
            <SwatchRow color={STATUS_COLORS.alerted ?? '#f472b6'} label="alerted" round />
            <SwatchRow color={STATUS_COLORS.accepted ?? '#4ade80'} label="accepted" round />
          </LegendBlock>
        </div>
      ) : (
        <p className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Toca el mapa para fijar la ubicación del reporte.
        </p>
      )}
    </div>
  );
}

function LayerToggle({
  active,
  onClick,
  label,
  swatchClass,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  swatchClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 transition ${
        active
          ? 'border-mg-600 bg-mg-50 font-semibold text-mg-900'
          : 'border-slate-200 bg-white text-slate-500 opacity-70'
      }`}
    >
      <span className={`inline-block h-3 w-3 rounded-sm border ${swatchClass}`} />
      {label}
    </button>
  );
}

function LegendBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 font-bold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

function SwatchRow({
  color,
  label,
  dashed,
  round,
}: {
  color: string;
  label: string;
  dashed?: boolean;
  round?: boolean;
}) {
  return (
    <div className="mb-1 flex items-center gap-2 text-slate-600">
      <span
        className={`inline-block shrink-0 border border-slate-900/30 ${
          round ? 'h-3 w-3 rounded-full' : 'h-3 w-5 rounded-sm'
        }`}
        style={{
          backgroundColor: color,
          borderStyle: dashed ? 'dashed' : 'solid',
          opacity: dashed ? 0.85 : 1,
        }}
      />
      <span>{label}</span>
    </div>
  );
}
