import { describe, expect, it } from 'vitest';
import { parseHtmlAttributeTable } from './parse-kml';

describe('@guardianes/geo-import', () => {
  it('exposes HTML attribute parsing', () => {
    expect(parseHtmlAttributeTable('<td>UH</td><td>290308</td>')).toEqual({ UH: '290308' });
  });
});
