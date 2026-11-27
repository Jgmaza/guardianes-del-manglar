import Link from 'next/link';
import { Button } from '@guardianes/ui';
import { AppShell } from '@/components/layout/AppShell';

export default function WelcomePage() {
  return (
    <AppShell variant="citizen">
      <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="animate-rise">
          <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">
            Atlántico · ciencia ciudadana
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-[1.05] md:text-6xl">
            Guardianes del Manglar
          </h1>
          <p className="mt-5 max-w-xl text-lg text-[var(--muted)]">
            Reporta en pocos pasos lo que ves en el manglar. Puedes hacerlo con o sin conexión. Tu
            nombre no es obligatorio: usamos código de seguimiento.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/reportar">
              <Button>Reportar ahora</Button>
            </Link>
            <Link href="/seguimiento">
              <Button variant="secondary">Consultar estado</Button>
            </Link>
          </div>
          <ul className="mt-8 space-y-2 text-sm text-[var(--muted)]">
            <li>· Foto + ubicación (GPS o mapa)</li>
            <li>· Funciona offline; sincroniza cuando vuelva la red</li>
            <li>· Privacidad: no pedimos cuenta ni datos personales innecesarios</li>
          </ul>
        </div>
        <aside className="animate-rise-delay rounded-3xl border border-white/10 bg-[var(--panel)] p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">Antes de enviar</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Un reporte guardado sin conexión <strong className="text-white">aún no</strong> está
            recibido por la C.R.A. Solo tras sincronizar con el servidor verás código y secreto
            confirmados.
          </p>
          <p className="mt-4 text-sm text-[var(--muted)]">
            ¿Eres analista de la autoridad ambiental?{' '}
            <Link href="/cra" className="text-[var(--gdm-sand)] underline">
              Abrir panel C.R.A.
            </Link>
          </p>
        </aside>
      </section>
    </AppShell>
  );
}
