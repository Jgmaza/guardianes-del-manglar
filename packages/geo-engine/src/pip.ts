/**
 * Local point-in-polygon for offline verification against normalized MultiPolygon.
 * Production path: PostGIS ST_Intersects + GiST (see migrations / sql* helpers).
 */

export type LonLat = { longitude: number; latitude: number };

type Ring = [number, number][];
type Polygon = Ring[];
type MultiPolygon = Polygon[];

function toRing(ring: number[][]): Ring {
  return ring.map((pos) => [pos[0] ?? 0, pos[1] ?? 0] as [number, number]);
}

function pointInRing(point: LonLat, ring: Ring): boolean {
  // Ray casting; vertices as [lon, lat]
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]?.[0] ?? 0;
    const yi = ring[i]?.[1] ?? 0;
    const xj = ring[j]?.[0] ?? 0;
    const yj = ring[j]?.[1] ?? 0;
    const intersect =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point: LonLat, polygon: Polygon): boolean {
  if (polygon.length === 0) return false;
  const outer = polygon[0];
  if (!outer || !pointInRing(point, outer)) return false;
  for (let h = 1; h < polygon.length; h += 1) {
    const hole = polygon[h];
    if (hole && pointInRing(point, hole)) return false;
  }
  return true;
}

export function pointInMultiPolygon(
  point: LonLat,
  coordinates: number[][][][],
): boolean {
  const multi: MultiPolygon = coordinates.map((poly) => poly.map((ring) => toRing(ring)));
  return multi.some((poly) => pointInPolygon(point, poly));
}

export function bboxContains(
  bbox: [number, number, number, number],
  point: LonLat,
): boolean {
  return (
    point.longitude >= bbox[0] &&
    point.longitude <= bbox[2] &&
    point.latitude >= bbox[1] &&
    point.latitude <= bbox[3]
  );
}

export function bboxesIntersect(
  a: [number, number, number, number],
  b: [number, number, number, number],
): boolean {
  return !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);
}
