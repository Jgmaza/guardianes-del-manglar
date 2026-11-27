export type GuardianBadge = {
  id: string;
  earnedAt: string;
  trackingCode?: string;
  species: string[];
  alias?: string;
  latitude: number;
  longitude: number;
  photoPreviewUrl?: string;
};

const STORAGE_KEY = 'guardianes:yo-estuve-aqui-badges';

export const SPECIES_OPTIONS = [
  'Mangle rojo',
  'Mangle negro',
  'Garza blanca',
  'Cangrejo azul',
  'Iguana verde',
  'Pelícano',
  'Paisaje / visita',
] as const;

export function loadBadges(): GuardianBadge[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuardianBadge[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBadge(badge: GuardianBadge): GuardianBadge[] {
  const next = [badge, ...loadBadges().filter((b) => b.id !== badge.id)].slice(0, 40);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function formatBadgeTitle(species: string[]): string {
  if (species.length === 0) return 'Guardian del Manglar';
  if (species.includes('Paisaje / visita')) return 'Visitante del Manglar';
  return `Guardian · ${species[0]}`;
}
