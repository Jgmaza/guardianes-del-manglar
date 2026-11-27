import type { ReportCategory } from '@guardianes/contracts';
import { newId } from './ids';
import { createDefaultCategoryCatalog, upsertCategory } from './categories';

/** Local (non-CRA) categories aligned with WhatsApp triage tipos. */
export const TRIAGE_CATEGORY_DEFS = [
  {
    code: 'tala',
    label: 'Tala / corte de árboles',
    description: 'Categoría local del bot (no catálogo oficial C.R.A.).',
  },
  {
    code: 'incendio',
    label: 'Fuego o humo',
    description: 'Categoría local del bot (no catálogo oficial C.R.A.).',
  },
  {
    code: 'residuos',
    label: 'Basura o escombros',
    description: 'Categoría local del bot (no catálogo oficial C.R.A.).',
  },
  {
    code: 'fauna',
    label: 'Fauna / caza',
    description: 'Categoría local del bot (no catálogo oficial C.R.A.).',
  },
  {
    code: 'invasion',
    label: 'Invasión de terreno o manglar',
    description: 'Categoría local del bot (no catálogo oficial C.R.A.).',
  },
  {
    code: 'avistamiento',
    label: 'Yo estuve aquí / avistamiento',
    description:
      'Registro ciudadano de visita o biodiversidad (foto + ubicación). No es denuncia.',
  },
] as const;

/** True for citizen science / check-in sightings (not denuncias). */
export function isAvistamientoCategory(code: string | null | undefined): boolean {
  return code === 'avistamiento';
}

export function createTriageCategoryCatalog(now = new Date().toISOString()): ReportCategory[] {
  let catalog = createDefaultCategoryCatalog(now);
  for (const def of TRIAGE_CATEGORY_DEFS) {
    catalog = upsertCategory(catalog, {
      id: newId(),
      code: def.code,
      label: def.label,
      description: def.description,
      active: true,
      source: 'local_config',
      createdAt: now,
    });
  }
  return catalog;
}

/** Maps bot session.tipo (TALA, …) → categoryCode for POST /api/v1/reports */
export function triageTipoToCategoryCode(tipo: string | null | undefined): string {
  if (!tipo) return 'uncategorized';
  const key = String(tipo).trim().toLowerCase();
  const known = TRIAGE_CATEGORY_DEFS.find((d) => d.code === key);
  return known?.code ?? 'uncategorized';
}
