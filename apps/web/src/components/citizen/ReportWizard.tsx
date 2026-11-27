'use client';

import { Button } from '@guardianes/ui';
import { Camera, Check, CircleCheck, CloudOff, LocateFixed, MapPin, ShieldCheck } from 'lucide-react';
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

const STEPS: Array<{ id: Step; label: string }> = [
  { id: 'photo', label: 'Foto' },
  { id: 'location', label: 'Ubicación' },
  { id: 'details', label: 'Detalles' },
];

const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const INPUT =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900 placeholder:text-slate-400';

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
      .then((data) =>
        setCategories(data.filter((c) => c.code !== 'avistamiento')),
      )
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
      <section className={`${CARD} mx-auto max-w-xl space-y-4 p-6`}>
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${result.synced ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
          >
            {result.synced ? (
              <CircleCheck className="h-6 w-6" aria-hidden />
            ) : (
              <CloudOff className="h-6 w-6" aria-hidden />
            )}
          </span>
          <h2 className="text-2xl font-bold text-slate-900">
            {result.synced ? 'Reporte recibido' : 'Reporte pendiente de sincronizar'}
          </h2>
        </div>
        <p className="text-sm text-slate-600">{result.message}</p>
        {result.synced && result.trackingCode ? (
          <div className="space-y-2 rounded-xl border border-emerald-200 bg-mg-50 p-4 text-sm text-slate-800">
            <p>
              <strong>Código:</strong>{' '}
              <span className="font-[family-name:var(--font-mono)]">{result.trackingCode}</span>
            </p>
            <p>
              <strong>Secreto:</strong>{' '}
              <span className="font-[family-name:var(--font-mono)]">{result.trackingSecret}</span>
            </p>
            <p className="text-xs text-slate-500">
              El secreto no se vuelve a mostrar. No compartas datos personales innecesarios.
            </p>
          </div>
        ) : (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
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
    <section className="space-y-5">
      <ol className="flex flex-wrap gap-2 text-sm" aria-label="Pasos del reporte">
        {STEPS.map(({ id, label }, idx) => {
          const current = STEPS.findIndex((s) => s.id === step);
          const state = idx < current ? 'done' : idx === current ? 'current' : 'next';
          return (
            <li
              key={id}
              aria-current={state === 'current' ? 'step' : undefined}
              className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 font-semibold ${
                state === 'current'
                  ? 'bg-mg-800 text-white'
                  : state === 'done'
                    ? 'bg-mg-100 text-mg-800'
                    : 'bg-white text-slate-500 ring-1 ring-slate-200'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  state === 'current' ? 'bg-white text-mg-800' : state === 'done' ? 'bg-mg-800 text-white' : 'bg-slate-100'
                }`}
              >
                {state === 'done' ? <Check className="h-3.5 w-3.5" aria-hidden /> : idx + 1}
              </span>
              {label}
            </li>
          );
        })}
      </ol>

      {step === 'photo' ? (
        <div className={`${CARD} space-y-4 p-5`}>
          <h2 className="text-xl font-bold text-slate-900">Captura una evidencia</h2>
          <p className="text-sm text-slate-600">
            Una foto basta para empezar. Tu identidad no es obligatoria.
          </p>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-mg-400 bg-mg-50 px-4 py-8 text-center transition hover:bg-mg-100">
            <Camera className="h-8 w-8 text-mg-800" aria-hidden />
            <span className="text-sm font-bold text-mg-800">
              {photo ? 'Cambiar foto' : 'Tomar o subir foto'}
            </span>
            <span className="text-xs text-slate-500">JPG o PNG desde la cámara o la galería</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const parsed = await fileToBase64(file);
                setPhoto({ ...parsed, previewUrl: URL.createObjectURL(file) });
              }}
            />
          </label>
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
          <div className={`${CARD} p-5`}>
            <h2 className="text-xl font-bold text-slate-900">¿Dónde ocurrió?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Usa el GPS o toca el mapa. La ubicación compartida no prueba por sí sola dónde se tomó
              la foto.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={captureGps}>
                <LocateFixed className="h-4 w-4" aria-hidden />
                Usar GPS
              </Button>
              {location ? (
                <p className="flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-mg-800" aria-hidden />
                  <span className="rounded bg-slate-100 px-1.5 font-[family-name:var(--font-mono)] text-xs">
                    {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                  </span>
                  {location.source === 'device_gps' ? 'GPS' : 'Marcado en mapa'}
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
        <div className={`${CARD} space-y-4 p-5`}>
          <h2 className="text-xl font-bold text-slate-900">Detalles opcionales</h2>
          <label className="block text-sm font-semibold text-slate-800">
            Categoría
            <select
              className={INPUT}
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
          <label className="block text-sm font-semibold text-slate-800">
            Descripción (opcional)
            <textarea
              className={`${INPUT} min-h-28`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              placeholder="¿Qué observaste?"
            />
          </label>
          <p className="flex gap-2 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
            Privacidad: no envíes nombres, cédulas ni teléfonos en la descripción. El seguimiento se
            hace con código + secreto.
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" role="alert">
          {error}
        </p>
      ) : null}

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
