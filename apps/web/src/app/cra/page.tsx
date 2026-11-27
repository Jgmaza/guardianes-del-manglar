import { AppShell } from '@/components/layout/AppShell';
import { CraDashboard } from '@/components/cra/Dashboard';

export default function CraPage() {
  return (
    <AppShell variant="cra">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-4xl">Panel C.R.A.</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
          Gestión de reportes ciudadanos, mapa con muestra simplificada de prioridades y alertas
          preliminares. Los listados iniciales incluyen fixtures de desarrollo etiquetados.
        </p>
      </div>
      <CraDashboard />
    </AppShell>
  );
}
