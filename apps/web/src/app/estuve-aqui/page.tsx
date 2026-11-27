import { AppShell } from '@/components/layout/AppShell';
import { EstuveAquiWizard } from '@/components/citizen/EstuveAquiWizard';

export default function EstuveAquiPage() {
  return (
    <AppShell variant="citizen">
      <div className="mb-5">
        <h1 className="text-2xl font-black text-slate-900 md:text-3xl">Yo estuve aquí</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Registra una foto de tu visita al manglar, elige qué viste y gana tu insignia de Guardian.
          La C.R.A. puede validarlo como ciencia ciudadana.
        </p>
      </div>
      <EstuveAquiWizard />
    </AppShell>
  );
}
