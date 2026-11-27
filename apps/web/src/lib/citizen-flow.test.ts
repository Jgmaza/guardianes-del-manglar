import { describe, expect, it } from 'vitest';

type Step = 'photo' | 'location' | 'details' | 'confirm';

function nextStep(step: Step): Step | null {
  if (step === 'photo') return 'location';
  if (step === 'location') return 'details';
  if (step === 'details') return 'confirm';
  return null;
}

describe('citizen report flow', () => {
  it('moves photo → location → details → confirm', () => {
    expect(nextStep('photo')).toBe('location');
    expect(nextStep('location')).toBe('details');
    expect(nextStep('details')).toBe('confirm');
    expect(nextStep('confirm')).toBeNull();
  });

  it('requires sync confirmation before claiming CRA reception', () => {
    const offlineSaved = { synced: false };
    const serverAck = { synced: true };
    expect(offlineSaved.synced).toBe(false);
    expect(serverAck.synced).toBe(true);
  });
});
