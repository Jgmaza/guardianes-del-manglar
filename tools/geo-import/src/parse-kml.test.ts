import { describe, expect, it } from 'vitest';
import {
  computeBBox,
  extractPolygonsAsMulti,
  parseHtmlAttributeTable,
} from './parse-kml';
import type { ValidationIssue } from './types';

describe('parse-kml', () => {
  it('parses HTML attribute tables without inventing keys', () => {
    const html = `<table><tr><td>FID</td><td>0</td></tr><tr><td>Val_Priori</td><td>Alto</td></tr></table>`;
    expect(parseHtmlAttributeTable(html)).toEqual({ FID: '0', Val_Priori: 'Alto' });
  });

  it('normalizes a polygon to multipolygon coordinates', () => {
    const issues: ValidationIssue[] = [];
    const body = `
      <MultiGeometry>
        <Polygon>
          <outerBoundaryIs><LinearRing><coordinates>
            -74.8,10.9,0 -74.7,10.9,0 -74.7,11.0,0 -74.8,11.0,0 -74.8,10.9,0
          </coordinates></LinearRing></outerBoundaryIs>
        </Polygon>
      </MultiGeometry>`;
    const extracted = extractPolygonsAsMulti(body, issues);
    expect(extracted?.geometryTypeOriginal).toBe('MultiGeometry');
    expect(extracted?.coordinates.length).toBe(1);
    const bbox = computeBBox(extracted!.coordinates);
    expect(bbox?.[0]).toBeCloseTo(-74.8);
    expect(bbox?.[2]).toBeCloseTo(-74.7);
  });
});
