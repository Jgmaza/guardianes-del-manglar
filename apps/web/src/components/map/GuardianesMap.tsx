'use client';

import { useEffect, useId, useRef } from 'react';
import type { DashboardReport } from '@/lib/api-client';

export type MapMode = 'citizen-pick' | 'overview';

type Props = {
  mode: MapMode;
  reports?: DashboardReport[];
  pick?: { longitude: number; latitude: number } | null;
  onPick?: (point: { longitude: number; latitude: number }) => void;
  showCraPolygons?: boolean;
  showInvemarPolygons?: boolean;
  className?: string;
};

const PRIORITY_COLORS: Record<string, string> = {
  Alto: '#b45309',
  Medio: '#ca8a04',
  Bajo: '#1f6b4a',
};

const SPECIES_COLORS: Record<string, string> = {
  'A. germinans': '#0f766e',
  'C. erectus': '#365314',
  'R. mangle': '#9f1239',
  'L. racemosa': '#a16207',
};

export function GuardianesMap({
  mode,
  reports = [],
  pick,
  onPick,
  showCraPolygons = true,
  showInvemarPolygons = true,
  className = '',
}: Props) {
  const mapId = useId().replace(/:/g, '');
  const mapRef = useRef<import('leaflet').Map | null>(null);

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

      const map = L.map(el, {
        center: [10.9, -74.85],
        zoom: 9,
      });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);

      if (showCraPolygons) {
        const res = await fetch('/fixtures/cra-priorities-sample.geojson');
        const geojson = await res.json();
        L.geoJSON(geojson, {
          style: (feature) => {
            const pri = String(feature?.properties?.Val_Priori ?? 'Bajo');
            return {
              color: PRIORITY_COLORS[pri] ?? '#2a8f6a',
              weight: 1,
              fillOpacity: 0.18,
            };
          },
          onEachFeature: (feature, layer) => {
            const p = feature.properties ?? {};
            layer.bindPopup(
              `<strong>${p.NOMUH ?? p.name ?? 'Unidad'}</strong><br/>` +
                `Prioridad C.R.A.: ${p.Val_Priori ?? '—'}<br/>` +
                `Subzona: ${p.NOMSZH ?? '—'}<br/>` +
                `<em>FIXTURE · muestra prioridades (~75 / 14.7k)</em>`,
            );
          },
        }).addTo(map);
      }

      if (showInvemarPolygons) {
        const res = await fetch('/fixtures/invemar-zonificacion-atlantico.geojson');
        const geojson = await res.json();
        L.geoJSON(geojson, {
          style: (feature) => {
            const sp = String(feature?.properties?.COB_SPDOM ?? '');
            return {
              color: SPECIES_COLORS[sp] ?? '#115e59',
              weight: 1,
              fillOpacity: 0.35,
            };
          },
          onEachFeature: (feature, layer) => {
            const p = feature.properties ?? {};
            layer.bindPopup(
              `<strong>${p.LOCALIDAD ?? 'Manglar'}</strong><br/>` +
                `Especie dom.: ${p.COB_SPDOM ?? '—'}<br/>` +
                `Zonif.: ${p.ZONIF ?? '—'}<br/>` +
                `Comp.: ${p.COB_CMPSCI ?? '—'}<br/>` +
                `<em>INVEMAR SIGMA · geometría simplificada</em>`,
            );
          },
        }).addTo(map);
      }

      for (const report of reports) {
        const marker = L.circleMarker([report.location.latitude, report.location.longitude], {
          radius: 7,
          color: '#f3f7f4',
          fillColor: PRIORITY_COLORS[report.priorityHint ?? 'Medio'] ?? '#2a8f6a',
          fillOpacity: 0.9,
          weight: 1,
        }).addTo(map);
        marker.bindPopup(
          `<strong>${report.trackingCode}</strong><br/>` +
            `${report.status}<br/>` +
            `${report.description ?? ''}<br/>` +
            `Prioridad: ${report.priorityHint ?? '—'} · ` +
            `Especie: ${report.dominantSpecies ?? '—'}`,
        );
      }

      if (mode === 'citizen-pick') {
        map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
          onPick?.({ latitude: e.latlng.lat, longitude: e.latlng.lng });
        });
      }

      if (pick) {
        L.circleMarker([pick.latitude, pick.longitude], {
          radius: 9,
          color: '#fff',
          fillColor: '#2a8f6a',
          fillOpacity: 1,
          weight: 2,
        }).addTo(map);
        map.setView([pick.latitude, pick.longitude], Math.max(map.getZoom(), 12));
      }
    }

    void setup();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [mapId, mode, onPick, pick, reports, showCraPolygons, showInvemarPolygons]);

  return (
    <div className={`overflow-hidden rounded-2xl border border-white/10 ${className}`}>
      <div id={`map-${mapId}`} className="h-[320px] w-full md:h-[420px]" />
      <p className="bg-black/30 px-3 py-2 text-xs text-[var(--muted)]">
        Capas: prioridades C.R.A. (fixture) · zonificación INVEMAR (especie/zonif., 196) · puntos =
        reportes. Join real al crear reporte vía PostGIS.
      </p>
    </div>
  );
}
