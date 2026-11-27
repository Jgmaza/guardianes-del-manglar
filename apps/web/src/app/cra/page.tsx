import { AppShell } from '@/components/layout/AppShell';
import { CraDashboard } from '@/components/cra/Dashboard';

export default function CraPage() {
  return (
    <AppShell variant="cra">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-slate-900 md:text-3xl">Panel C.R.A.</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Mapa operativo · prioridades C.R.A., manglares INVEMAR y reportes ciudadanos.
        </p>
      </div>
      <CraDashboard />
    </AppShell>
  );
}
