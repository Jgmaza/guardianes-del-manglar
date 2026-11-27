'use client';

import { Button } from '@guardianes/ui';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCategories } from '@/lib/api-client';
import { listPendingReports } from '@/lib/offline/db';
import { enqueueReport, syncPendingReports } from '@/lib/offline/sync';

const GuardianesMap = dynamic(
  () => import('@/components/map/GuardianesMap').then((m) => m.GuardianesMap),
  { ssr: false },
);

type Step = 'photo' | 'location' | 'details' | 'confirm';

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string; byteLength: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const base64 = result.includes(',') ? result.split(',')[1]! : result;
      resolve({ base64, mimeType: file.type || 'image/jpeg', byteLength: file.size });
    };
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
}

export function ReportWizard() {
  const [step, setStep] = useState<Step>('photo');
  const [photo, setPhoto] = useState<{
    mimeType: string;
    base64: string;
    byteLength: number;
    previewUrl: string;
  } | null>(null);
  const [location, setLocation] = useState<{
    longitude: number;
    latitude: number;
    accuracyMeters?: number;
    source: 'device_gps' | 'map_pin';
  } | null>(null);
  const [description, setDescription] = useState('');
  const [categoryCode, setCategoryCode] = useState('uncategorized');
  const [categories, setCategories] = useState<Array<{ code: string; label: string; source: string }>>(
    [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    clientReportId: string;
    synced: boolean;
    trackingCode?: string;
    trackingSecret?: string;
    message: string;
  } | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const syncOnline = () => setOnline(navigator.onLine);
    window.addEventListener('online', syncOnline);
    window.addEventListener('offline', syncOnline);
    void fetchCategories()
      .then((data) => setCategories(data))
      .catch(() =>
        setCategories([
          {
            code: 'uncategorized',
            label: 'Sin categoría asignada (placeholder)',
            source: 'system_placeholder',
          },
        ]),
      );
    void listPendingReports().then((rows) => setQueueCount(rows.length));
    return () => {
      window.removeEventListener('online', syncOnline);
      window.removeEventListener('offline', syncOnline);
    };
  }, []);

  const onPick = useCallback((point: { longitude: number; latitude: number }) => {
    setLocation({ ...point, source: 'map_pin' });
  }, []);

  const captureGps = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError('Este dispositivo no ofrece geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          longitude: pos.coords.longitude,
          latitude: pos.coords.latitude,
          accuracyMeters: pos.coords.accuracy,
          source: 'device_gps',
        });
      },
      () => setError('No se pudo obtener el GPS. Puedes marcar el punto en el mapa.'),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const canContinue = useMemo(() => {
    if (step === 'photo') return Boolean(photo);
    if (step === 'location') return Boolean(location);
    return true;
  }, [step, photo, location]);

  const submit = async () => {
    if (!location || !photo) return;
    setBusy(true);
    setError(null);
    try {
      const clientReportId = crypto.randomUUID();
      const record = await enqueueReport({
        clientReportId,
        channel: 'pwa',
        description: description.trim() || undefined,
        categoryCode,
        location,
        observedAt: new Date().toISOString(),
        photo: {
          mimeType: photo.mimeType,
          base64: photo.base64,
          byteLength: photo.byteLength,
        },
      });

      if (online) {
        const sync = await syncPendingReports();
        const syncedItem = sync.details.find((d) => d.clientReportId === clientReportId && d.ok);
        const pending = await listPendingReports();
        const mine = pending.find((p) => p.clientReportId === clientReportId);
        setQueueCount(pending.length);
        if (syncedItem && mine?.status === 'synced') {
          setResult({
            clientReportId,
            synced: true,
            trackingCode: mine.trackingCode,
            trackingSecret: mine.trackingSecret,
            message:
              'Tu reporte fue recibido por el servidor de Guardianes. Guarda el código y el secreto de seguimiento.',
          });
        } else {
          setResult({
            clientReportId,
            synced: false,
            message:
              'El reporte quedó en cola local. Aún no está confirmado ante la C.R.A./servidor. Se reintentará al recuperar conexión.',
          });
        }
      } else {
        setResult({
          clientReportId: record.clientReportId,
          synced: false,
          message:
            'Sin conexión: el reporte se guardó en este dispositivo y está pendiente de sincronización. No ha sido recibido todavía por la C.R.A.',
        });
        const pending = await listPendingReports();
        setQueueCount(pending.length);
      }
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el reporte');
    } finally {
      setBusy(false);
    }
  };

  if (result && step === 'confirm') {
    return (
      <section className="mx-auto max-w-xl space-y-4 rounded-2xl border border-white/10 bg-[var(--panel)] p-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          {result.synced ? 'Reporte recibido' : 'Reporte pendiente de sincronizar'}
        </h2>
        <p className="text-sm text-[var(--muted)]">{result.message}</p>
        {result.synced && result.trackingCode ? (
          <div className="space-y-2 rounded-xl bg-black/30 p-4 text-sm">
            <p>
              <strong>Código:</strong> {result.trackingCode}
            </p>
            <p>
              <strong>Secreto:</strong> {result.trackingSecret}
            </p>
            <p className="text-xs text-[var(--muted)]">
              El secreto no se vuelve a mostrar. No compartas datos personales innecesarios.
            </p>
          </div>
        ) : (
          <p className="text-xs text-amber-200">
            ID local: {result.clientReportId}. Cola actual: {queueCount} ítem(s).
          </p>
        )}
        <div className="flex gap-3">
          <Button onClick={() => (window.location.href = '/seguimiento')}>Ir a seguimiento</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setResult(null);
              setPhoto(null);
              setLocation(null);
              setDescription('');
              setStep('photo');
            }}
          >
            Nuevo reporte
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <ol className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-[var(--muted)]">
        {(['photo', 'location', 'details'] as Step[]).map((s) => (
          <li
            key={s}
            className={`rounded-full px-3 py-1 ${step === s ? 'bg-white/15 text-white' : 'bg-white/5'}`}
          >
            {s === 'photo' ? '1 · Foto' : s === 'location' ? '2 · Ubicación' : '3 · Detalles'}
          </li>
        ))}
      </ol>

      {step === 'photo' ? (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-[var(--panel)] p-5">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">Captura una evidencia</h2>
          <p className="text-sm text-[var(--muted)]">
            Una foto basta para empezar. Tu identidad no es obligatoria.
          </p>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const parsed = await fileToBase64(file);
              setPhoto({ ...parsed, previewUrl: URL.createObjectURL(file) });
            }}
          />
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.previewUrl}
              alt="Vista previa de la evidencia"
              className="max-h-64 rounded-xl object-cover"
            />
          ) : null}
        </div>
      ) : null}

      {step === 'location' ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-5">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">¿Dónde ocurrió?</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Usa el GPS o toca el mapa. La ubicación compartida no prueba por sí sola dónde se tomó
              la foto.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={captureGps}>Usar GPS</Button>
              {location ? (
                <p className="text-sm text-[var(--muted)]">
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)} · {location.source}
                  {location.accuracyMeters
                    ? ` · ±${Math.round(location.accuracyMeters)} m`
                    : ''}
                </p>
              ) : null}
            </div>
          </div>
          <GuardianesMap
            mode="citizen-pick"
            pick={location}
            onPick={onPick}
            showCraPolygons
          />
        </div>
      ) : null}

      {step === 'details' ? (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-[var(--panel)] p-5">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">Detalles opcionales</h2>
          <label className="block text-sm">
            Categoría
            <select
              className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2"
              value={categoryCode}
              onChange={(e) => setCategoryCode(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label} {c.source !== 'cra_official' ? '(no oficial C.R.A. aún)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Descripción (opcional)
            <textarea
              className="mt-1 min-h-28 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              placeholder="¿Qué observaste?"
            />
          </label>
          <p className="text-xs text-[var(--muted)]">
            Privacidad: no envíes nombres, cédulas ni teléfonos en la descripción. El seguimiento se
            hace con código + secreto.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-amber-200">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        {step !== 'photo' ? (
          <Button
            variant="secondary"
            onClick={() =>
              setStep(step === 'details' ? 'location' : 'photo')
            }
          >
            Atrás
          </Button>
        ) : null}
        {step !== 'details' ? (
          <Button disabled={!canContinue} onClick={() => setStep(step === 'photo' ? 'location' : 'details')}>
            Continuar
          </Button>
        ) : (
          <Button disabled={busy || !location || !photo} onClick={() => void submit()}>
            {busy ? 'Guardando…' : online ? 'Enviar reporte' : 'Guardar offline'}
          </Button>
        )}
      </div>
    </section>
  );
}
