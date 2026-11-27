import { describe, expect, it } from 'vitest';
import { StatusBadge } from './status-badge';

describe('@guardianes/ui', () => {
  it('exports StatusBadge component', () => {
    expect(typeof StatusBadge).toBe('function');
  });
});
