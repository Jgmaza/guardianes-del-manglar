import type { ReportCategory } from '@guardianes/contracts';
import { newId } from './ids';

/**
 * Configurable catalog. Official CRA categories arrive later.
 * Placeholder is explicitly non-official.
 */
export function createDefaultCategoryCatalog(now = new Date().toISOString()): ReportCategory[] {
  return [
    {
      id: newId(),
      code: 'uncategorized',
      label: 'Sin categoría asignada',
      description:
        'Placeholder interno hasta que la C.R.A. suministre el catálogo oficial. No es una categoría oficial.',
      active: true,
      source: 'system_placeholder',
      createdAt: now,
    },
  ];
}

export function resolveCategory(
  catalog: ReportCategory[],
  options: { categoryId?: string; categoryCode?: string },
): ReportCategory | null {
  if (options.categoryId) {
    return catalog.find((c) => c.id === options.categoryId && c.active) ?? null;
  }
  if (options.categoryCode) {
    return catalog.find((c) => c.code === options.categoryCode && c.active) ?? null;
  }
  return catalog.find((c) => c.code === 'uncategorized' && c.active) ?? null;
}

export function upsertCategory(
  catalog: ReportCategory[],
  input: Omit<ReportCategory, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
): ReportCategory[] {
  const now = input.createdAt ?? new Date().toISOString();
  const existingIndex = catalog.findIndex(
    (c) => c.code === input.code || (input.id && c.id === input.id),
  );
  const next: ReportCategory = {
    id: input.id ?? catalog[existingIndex]?.id ?? newId(),
    code: input.code,
    label: input.label,
    description: input.description,
    active: input.active,
    source: input.source,
    createdAt: catalog[existingIndex]?.createdAt ?? now,
  };
  if (existingIndex >= 0) {
    const copy = [...catalog];
    copy[existingIndex] = next;
    return copy;
  }
  return [...catalog, next];
}
