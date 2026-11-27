import type { MultiPolygonCoords, PolygonCoords, Position, ValidationIssue } from './types';

export function parseHtmlAttributeTable(descriptionHtml: string): Record<string, string> {
  const pairs = descriptionHtml.matchAll(/<td>([^<]+)<\/td>\s*<td>([^<]*)<\/td>/g);
  const out: Record<string, string> = {};
  for (const match of pairs) {
    const key = match[1];
    const value = match[2];
    if (key) {
      out[key] = value ?? '';
    }
  }
  return out;
}

function parsePosition(token: string, issues: ValidationIssue[]): Position | null {
  const parts = token.split(',');
  if (parts.length < 2) {
    issues.push({
      code: 'COORD_TOKEN_MALFORMED',
      message: `Coordinate token missing lon/lat: ${token}`,
      severity: 'error',
    });
    return null;
  }
  const lon = Number(parts[0]);
  const lat = Number(parts[1]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    issues.push({
      code: 'COORD_NOT_NUMERIC',
      message: `Non-numeric coordinate: ${token}`,
      severity: 'error',
    });
    return null;
  }
  if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
    issues.push({
      code: 'COORD_OUT_OF_RANGE',
      message: `Coordinate out of WGS84 range: ${token}`,
      severity: 'error',
    });
    return null;
  }
  if (parts.length >= 3 && parts[2] !== undefined && parts[2] !== '') {
    const alt = Number(parts[2]);
    if (Number.isFinite(alt)) {
      return [lon, lat, alt];
    }
  }
  return [lon, lat];
}

export function parseCoordinateRing(
  coordinatesText: string,
  issues: ValidationIssue[],
): Position[] {
  const ring: Position[] = [];
  for (const token of coordinatesText.trim().split(/\s+/)) {
    if (!token) continue;
    const pos = parsePosition(token, issues);
    if (pos) ring.push(pos);
  }
  return ring;
}

function ensureClosed(ring: Position[], issues: ValidationIssue[]): Position[] {
  if (ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!first || !last) return ring;
  if (first[0] !== last[0] || first[1] !== last[1]) {
    issues.push({
      code: 'RING_NOT_CLOSED',
      message: 'LinearRing was not closed; closing by repeating first vertex',
      severity: 'warning',
    });
    return [...ring, [first[0], first[1], ...(first.length > 2 ? [first[2] as number] : [])] as Position];
  }
  return ring;
}

export function parsePolygonXml(
  polygonXml: string,
  issues: ValidationIssue[],
): PolygonCoords | null {
  const outerMatch = polygonXml.match(
    /<outerBoundaryIs>[\s\S]*?<coordinates>\s*([^<]*)<\/coordinates>[\s\S]*?<\/outerBoundaryIs>/,
  );
  if (!outerMatch?.[1]) {
    issues.push({
      code: 'POLYGON_MISSING_OUTER',
      message: 'Polygon missing outerBoundaryIs coordinates',
      severity: 'error',
    });
    return null;
  }

  let outer = parseCoordinateRing(outerMatch[1], issues);
  outer = ensureClosed(outer, issues);
  if (outer.length < 4) {
    issues.push({
      code: 'RING_TOO_FEW_VERTICES',
      message: `Outer ring has ${outer.length} positions (need >= 4)`,
      severity: 'error',
    });
    return null;
  }

  const rings: PolygonCoords = [outer];
  const innerRe =
    /<innerBoundaryIs>[\s\S]*?<coordinates>\s*([^<]*)<\/coordinates>[\s\S]*?<\/innerBoundaryIs>/g;
  for (const inner of polygonXml.matchAll(innerRe)) {
    if (!inner[1]) continue;
    let hole = parseCoordinateRing(inner[1], issues);
    hole = ensureClosed(hole, issues);
    if (hole.length < 4) {
      issues.push({
        code: 'HOLE_TOO_FEW_VERTICES',
        message: `Inner ring has ${hole.length} positions (need >= 4)`,
        severity: 'error',
      });
      continue;
    }
    rings.push(hole);
  }
  return rings;
}

export function extractPolygonsAsMulti(
  placemarkBody: string,
  issues: ValidationIssue[],
): { coordinates: MultiPolygonCoords; geometryTypeOriginal: string } | null {
  const polygonBlocks = [...placemarkBody.matchAll(/<Polygon\b[\s\S]*?<\/Polygon>/g)].map(
    (m) => m[0],
  );
  if (polygonBlocks.length === 0) {
    issues.push({
      code: 'NO_POLYGON',
      message: 'Placemark has no Polygon geometry',
      severity: 'error',
    });
    return null;
  }

  const multi: MultiPolygonCoords = [];
  for (const block of polygonBlocks) {
    const poly = parsePolygonXml(block, issues);
    if (poly) multi.push(poly);
  }

  if (multi.length === 0) {
    return null;
  }

  const geometryTypeOriginal = placemarkBody.includes('<MultiGeometry')
    ? 'MultiGeometry'
    : polygonBlocks.length > 1
      ? 'multiple_Polygon'
      : 'Polygon';

  return { coordinates: multi, geometryTypeOriginal };
}

export function computeBBox(
  coordinates: MultiPolygonCoords,
): [number, number, number, number] | null {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  let any = false;
  for (const polygon of coordinates) {
    for (const ring of polygon) {
      for (const pos of ring) {
        any = true;
        minLon = Math.min(minLon, pos[0]);
        maxLon = Math.max(maxLon, pos[0]);
        minLat = Math.min(minLat, pos[1]);
        maxLat = Math.max(maxLat, pos[1]);
      }
    }
  }
  if (!any) return null;
  return [minLon, minLat, maxLon, maxLat];
}

export type RawPlacemark = {
  id: string | null;
  name: string | null;
  styleUrl: string | null;
  descriptionHtml: string | null;
  body: string;
};

export function* iteratePlacemarks(kmlText: string): Generator<RawPlacemark> {
  const re = /<Placemark([^>]*)>([\s\S]*?)<\/Placemark>/g;
  for (const match of kmlText.matchAll(re)) {
    const attrs = match[1] ?? '';
    const body = match[2] ?? '';
    const idMatch = attrs.match(/\bid="([^"]+)"/);
    const nameMatch = body.match(/<name>([^<]*)<\/name>/);
    const styleMatch = body.match(/<styleUrl>([^<]*)<\/styleUrl>/);
    const descMatch = body.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
    yield {
      id: idMatch?.[1] ?? null,
      name: nameMatch?.[1] ?? null,
      styleUrl: styleMatch?.[1] ?? null,
      descriptionHtml: descMatch?.[1] ?? null,
      body,
    };
  }
}
