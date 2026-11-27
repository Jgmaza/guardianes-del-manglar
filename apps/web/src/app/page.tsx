import { Button } from '@guardianes/ui';
import { Camera, ClipboardList, CloudOff, Info, MapPin, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';

const FEATURES = [
  { icon: MapPin, title: 'Foto + ubicación', body: 'Con GPS o marcando el punto en el mapa.' },
  { icon: CloudOff, title: 'Funciona offline', body: 'Se sincroniza cuando vuelva la red.' },
  { icon: ShieldCheck, title: 'Privacidad', body: 'Sin cuenta ni datos personales innecesarios.' },
];

const ACTIONS = [
  { href: '/reportar', icon: Camera, title: 'Nuevo reporte', body: 'Foto, ubicación y detalles' },
  { href: '/seguimiento', icon: ClipboardList, title: 'Mis reportes', body: 'Consulta con código y secreto' },
];

export default function WelcomePage() {
  return (
    <AppShell variant="citizen">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="animate-rise overflow-hidden rounded-2xl bg-mg-900 p-6 text-white shadow md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mg-400">
            Atlántico · ciencia ciudadana
          </p>
          <h1 className="mt-3 text-4xl font-black leading-[1.05] md:text-5xl">
            Guardianes del Manglar
          </h1>
          <p className="mt-4 max-w-xl text-base text-mg-100 md:text-lg">
            Reporta en pocos pasos lo que ves en el manglar. Puedes hacerlo con o sin conexión. Tu
            nombre no es obligatorio: usamos código de seguimiento.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/reportar">
              <Button className="bg-mg-500! text-mg-950! hover:bg-mg-400!">
                <Camera className="h-4 w-4" aria-hidden />
                Reportar ahora
              </Button>
            </Link>
            <Link href="/seguimiento">
              <Button variant="secondary" className="border-mg-400! bg-transparent! text-white! hover:bg-mg-800!">
                Consultar estado
              </Button>
            </Link>
          </div>
        </div>

        <aside className="animate-rise-delay flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-900">Acciones rápidas</h2>
          {ACTIONS.map(({ href, icon: Icon, title, body }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mg-50 text-mg-800">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-900">{title}</span>
                <span className="block text-xs text-slate-500">{body}</span>
              </span>
            </Link>
          ))}
          <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
            <div>
              <h2 className="text-sm font-bold text-amber-900">Antes de enviar</h2>
              <p className="mt-1 text-xs leading-relaxed text-amber-900">
                Un reporte guardado sin conexión <strong>aún no</strong> está recibido por la
                C.R.A. Solo tras sincronizar con el servidor verás código y secreto confirmados.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-900">{title}</span>
              <span className="block text-xs text-slate-500">{body}</span>
            </span>
          </div>
        ))}
      </section>

      <p className="mt-6 text-sm text-slate-600">
        ¿Eres analista de la autoridad ambiental?{' '}
        <Link href="/cra" className="font-semibold text-mg-800 underline">
          Abrir panel C.R.A.
        </Link>
      </p>
    </AppShell>
  );
}
