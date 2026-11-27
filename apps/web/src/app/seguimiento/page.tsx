import { AppShell } from '@/components/layout/AppShell';
import { TrackForm } from '@/components/citizen/TrackForm';

export default function SeguimientoPage() {
  return (
    <AppShell variant="citizen">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-4xl">Seguimiento</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Consulta el estado con tu código y secreto. También puedes ver reportes aún pendientes en
          este teléfono.
        </p>
      </div>
      <TrackForm />
    </AppShell>
  );
}
