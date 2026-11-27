export type FoundationStatus = 'foundation' | 'pending' | 'ready';

const LABELS: Record<FoundationStatus, string> = {
  foundation: 'Fundación técnica',
  pending: 'Pendiente',
  ready: 'Listo',
};

export function StatusBadge({ status }: { status: FoundationStatus }) {
  const tone =
    status === 'ready'
      ? 'bg-emerald-100 text-emerald-900'
      : status === 'pending'
        ? 'bg-amber-100 text-amber-900'
        : 'bg-teal-100 text-teal-900';

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {LABELS[status]}
    </span>
  );
}
