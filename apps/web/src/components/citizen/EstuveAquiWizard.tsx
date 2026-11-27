'use client';

import { Button } from '@guardianes/ui';
import {
  Camera,
  Check,
  CircleCheck,
  CloudOff,
  LocateFixed,
  MapPin,
  Award,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GuardianBadgeCard } from '@/components/citizen/GuardianBadgeCard';
import {
  SPECIES_OPTIONS,
  loadBadges,
  saveBadge,
  type GuardianBadge,
} from '@/lib/badges';
import { enqueueReport, syncPendingReports } from '@/lib/offline/sync';
import { listPendingReports } from '@/lib/offline/db';

const GuardianesMap = dynamic(
  () => import('@/components/map/GuardianesMap').then((m) => m.GuardianesMap),
  { ssr: false },
);

type Step = 'photo' | 'location' | 'details' | 'confirm';

const STEPS: Array<{ id: Step; label: string }> = [
  { id: 'photo', label: 'Foto' },
  { id: 'location', label: 'Lugar' },
  { id: 'details', label: 'Insignia' },
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

export function EstuveAquiWizard() {
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
  const [species, setSpecies] = useState<string[]>([]);
  const [alias, setAlias] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [badges, setBadges] = useState<GuardianBadge[]>([]);
  const [earned, setEarned] = useState<GuardianBadge | null>(null);

  useEffect(() => {
    setBadges(loadBadges());
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  const onPick = useCallback((point: { longitude: number; latitude: number }) => {
    setLocation({
      longitude: point.longitude,
      latitude: point.latitude,
      source: 'map_pin',
    });
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
      () => setError('No se pudo obtener el GPS. Marca el punto en el mapa.'),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const toggleSpecies = (tag: string) => {
    setSpecies((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 4),
    );
  };

  const canContinue = useMemo(() => {
    if (step === 'photo') return Boolean(photo);
    if (step === 'location') return Boolean(location);
    if (step === 'details') return species.length > 0;
    return true;
  }, [step, photo, location, species]);

  const submit = async () => {
    if (!location || !photo || species.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const clientReportId = crypto.randomUUID();
      const safeAlias = alias.trim().slice(0, 40);
      const description = [
        'Yo estuve aquí',
        `Especies: ${species.join(', ')}`,
        safeAlias ? `Visitante: ${safeAlias}` : null,
        note.trim() || null,
      ]
        .filter(Boolean)
        .join('\n');

      await enqueueReport({
        clientReportId,
        channel: 'pwa',
        description,
        categoryCode: 'avistamiento',
        location,
        observedAt: new Date().toISOString(),
        photo: {
          mimeType: photo.mimeType,
          base64: photo.base64,
          byteLength: photo.byteLength,
        },
      });

      let trackingCode: string | undefined;
      let synced = false;
      if (online) {
        const sync = await syncPendingReports();
        const syncedItem = sync.details.find((d) => d.clientReportId === clientReportId && d.ok);
        const pending = await listPendingReports();
        const mine = pending.find((p) => p.clientReportId === clientReportId);
        synced = Boolean(syncedItem && mine?.status === 'synced');
        trackingCode = mine?.trackingCode;
      }

      const badge: GuardianBadge = {
        id: clientReportId,
        earnedAt: new Date().toISOString(),
        trackingCode,
        species,
        alias: safeAlias || undefined,
        latitude: location.latitude,
        longitude: location.longitude,
        photoPreviewUrl: photo.previewUrl,
      };
      setBadges(saveBadge(badge));
      setEarned(badge);
      setStep('confirm');
      if (!synced && !online) {
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el registro');
    } finally {
      setBusy(false);
    }
  };

  if (earned && step === 'confirm') {
    return (
      <section className="mx-auto max-w-lg space-y-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            {online ? (
              <CircleCheck className="h-6 w-6" aria-hidden />
            ) : (
              <CloudOff className="h-6 w-6" aria-hidden />
            )}
          </span>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">¡Insignia ganada!</h2>
            <p className="text-sm text-slate-600">
              Tu foto quedó registrada como visita al manglar
              {earned.trackingCode ? (
                <>
                  {' '}
                  · código{' '}
                  <span className="font-[family-name:var(--font-mono)] font-semibold">
                    {earned.trackingCode}
                  </span>
                </>
              ) : (
                ' (se sincronizará cuando haya red)'
              )}
              .
            </p>
          </div>
        </div>

        <GuardianBadgeCard badge={earned} />

        <p className="rounded-lg bg-mg-50 px-3 py-2 text-xs text-mg-900">
          La C.R.A. puede validar tu avistamiento en la pestaña Biodiversidad del panel. La insignia
          queda guardada en este dispositivo.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setEarned(null);
              setPhoto(null);
              setLocation(null);
              setSpecies([]);
              setAlias('');
              setNote('');
              setStep('photo');
            }}
          >
            <Camera className="h-4 w-4" aria-hidden />
            Otra foto
          </Button>
          <Button variant="secondary" onClick={() => (window.location.href = '/')}>
            Volver al inicio
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <ol className="flex flex-wrap gap-2 text-sm" aria-label="Pasos">
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
                  state === 'current'
                    ? 'bg-white text-mg-800'
                    : state === 'done'
                      ? 'bg-mg-800 text-white'
                      : 'bg-slate-100'
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
          <h2 className="text-xl font-bold text-slate-900">Tu foto en el manglar</h2>
          <p className="text-sm text-slate-600">
            Estilo «yo estuve aquí»: captura el paisaje, flora o fauna. No es una denuncia.
          </p>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50 px-4 py-8 text-center transition hover:bg-emerald-100">
            <Camera className="h-8 w-8 text-emerald-800" aria-hidden />
            <span className="text-sm font-bold text-emerald-900">
              {photo ? 'Cambiar foto' : 'Tomar o subir foto'}
            </span>
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
              alt="Vista previa"
              className="max-h-64 w-full rounded-xl object-cover"
            />
          ) : null}
        </div>
      ) : null}

      {step === 'location' ? (
        <div className="space-y-4">
          <div className={`${CARD} p-5`}>
            <h2 className="text-xl font-bold text-slate-900">¿Dónde estuviste?</h2>
            <p className="mt-2 text-sm text-slate-600">GPS o toca el mapa cerca de Mallorquín.</p>
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
                </p>
              ) : null}
            </div>
          </div>
          <GuardianesMap mode="citizen-pick" pick={location} onPick={onPick} showCraPolygons />
        </div>
      ) : null}

      {step === 'details' ? (
        <div className={`${CARD} space-y-4 p-5`}>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Award className="h-5 w-5 text-mg-800" aria-hidden />
            Elige tu insignia
          </h2>
          <p className="text-sm text-slate-600">Marca qué viste (máx. 4). Ganas la insignia al enviar.</p>
          <div className="flex flex-wrap gap-2">
            {SPECIES_OPTIONS.map((tag) => {
              const on = species.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleSpecies(tag)}
                  aria-pressed={on}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    on
                      ? 'border-emerald-700 bg-emerald-700 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          <label className="block text-sm font-semibold text-slate-800">
            Cómo firmas (opcional)
            <input
              className={INPUT}
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              maxLength={40}
              placeholder="Ej. Ana M. · turista"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-800">
            Nota breve (opcional)
            <textarea
              className={`${INPUT} min-h-20`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={400}
              placeholder="Lo que quieras recordar de la visita"
            />
          </label>
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
            onClick={() => setStep(step === 'details' ? 'location' : 'photo')}
          >
            Atrás
          </Button>
        ) : null}
        {step !== 'details' ? (
          <Button
            disabled={!canContinue}
            onClick={() => setStep(step === 'photo' ? 'location' : 'details')}
          >
            Continuar
          </Button>
        ) : (
          <Button disabled={busy || !canContinue} onClick={() => void submit()}>
            {busy ? 'Registrando…' : 'Ganar insignia'}
          </Button>
        )}
      </div>

      {badges.length > 0 && step === 'photo' ? (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-slate-900">Tus insignias en este dispositivo</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {badges.slice(0, 4).map((b) => (
              <GuardianBadgeCard key={b.id} badge={b} compact />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
