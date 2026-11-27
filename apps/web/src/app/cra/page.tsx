import { AppShell } from '@/components/layout/AppShell';
import { CraDashboard } from '@/components/cra/Dashboard';

export default function CraPage() {
  return (
    <AppShell variant="cra">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 md:text-4xl">Panel C.R.A.</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Mapa operativo con tres capas: prioridades C.R.A. (zonas hidrográficas), manglares
          INVEMAR (especie / zonificación) y puntos de reportes ciudadanos. Usa los toggles y la
          leyenda bajo el mapa; clic en cada elemento para el detalle.
        </p>
      </div>
      <CraDashboard />
    </AppShell>
  );
}
