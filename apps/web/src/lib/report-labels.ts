export const STATUS_LABELS: Record<string, string> = {
  submitted: 'Recibido',
  geo_processed: 'Geo procesado',
  under_review: 'En revisión',
  needs_info: 'Requiere información',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  alerted: 'Con alerta',
};

export const STATUS_TONES: Record<string, string> = {
  submitted: 'bg-slate-200 text-slate-800',
  geo_processed: 'bg-sky-100 text-sky-800',
  under_review: 'bg-amber-100 text-amber-800',
  needs_info: 'bg-orange-100 text-orange-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-slate-100 text-slate-500',
  alerted: 'bg-red-100 text-red-800',
};

export type PriorityStyle = { color: string; badge: string; label: string };

export const PRIORITY_STYLES: Record<string, PriorityStyle> = {
  Alto: { color: '#dc2626', badge: 'bg-red-100 text-red-800 border-red-300', label: 'Alta' },
  Medio: { color: '#f59e0b', badge: 'bg-amber-100 text-amber-800 border-amber-300', label: 'Media' },
  Bajo: { color: '#10b981', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: 'Baja' },
};

const NO_PRIORITY: PriorityStyle = {
  color: '#94a3b8',
  badge: 'bg-slate-100 text-slate-700 border-slate-300',
  label: 'Sin cobertura',
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusTone(status: string): string {
  return STATUS_TONES[status] ?? 'bg-slate-200 text-slate-800';
}

export function priorityStyle(priority: string | null | undefined): PriorityStyle {
  return (priority && PRIORITY_STYLES[priority]) || NO_PRIORITY;
}

/** Lower = more urgent for CRA triage (matches Dashboard Manglar sort). */
export function impactRank(report: {
  priorityHint?: string | null;
  status: string;
  hasPreliminaryAlert?: boolean;
}): number {
  const pri =
    report.priorityHint === 'Alto'
      ? 0
      : report.priorityHint === 'Medio'
        ? 1
        : report.priorityHint === 'Bajo'
          ? 2
          : 3;
  const open =
    report.status === 'accepted' || report.status === 'rejected'
      ? 10
      : report.hasPreliminaryAlert || report.status === 'alerted'
        ? 0
        : report.status === 'under_review'
          ? 1
          : 2;
  return pri * 10 + open;
}

export function isOpenReport(status: string): boolean {
  return status !== 'accepted' && status !== 'rejected';
}

/** Ciencia ciudadana / «yo estuve aquí» (no denuncia). */
export function isAvistamiento(categoryCode: string | null | undefined): boolean {
  return categoryCode === 'avistamiento';
}

export function timeAgo(iso: string, now: number = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `hace ${minutes} min`;
  if (minutes < 1440) return `hace ${Math.round(minutes / 60)} h`;
  return `hace ${Math.round(minutes / 1440)} d`;
}
