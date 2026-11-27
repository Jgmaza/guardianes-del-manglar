import { AppShell } from '@/components/layout/AppShell';
import { ReportWizard } from '@/components/citizen/ReportWizard';

export default function ReportarPage() {
  return (
    <AppShell variant="citizen">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 md:text-4xl">Crear reporte</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Tres pasos: evidencia, ubicación y detalles. Si no hay red, lo guardamos en este
          dispositivo y lo enviaremos después.
        </p>
      </div>
      <ReportWizard />
    </AppShell>
  );
}
