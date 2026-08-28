import { describe, expect, it } from 'vitest';
import { freshState } from '../src/data';
import { normalizeAppState, parseBackup } from '../src/state';

describe('backup and persisted-state validation', () => {
  it('accepts the complete state emitted by the product', () => {
    const data = freshState();
    expect(normalizeAppState(data)).toEqual(data);
    expect(parseBackup({ product: 'pantry-meal-gap', version: 1, exportedAt: new Date().toISOString(), data })).toEqual(data);
  });

  it('rejects the verifier’s incomplete backup before it can be saved', () => {
    const malformed = {
      product: 'pantry-meal-gap',
      data: {
        seeded: true,
        pantry: [],
        meals: [{ id: 'bad-meal', name: 'Malformed backup', ingredients: [{ id: 'bad-ingredient', name: 'rice', quantity: 1, unit: 'cup', substitutions: [] }] }],
        shopping: [],
        history: []
      }
    };
    expect(parseBackup(malformed)).toBeNull();
    expect(normalizeAppState(malformed.data)).toBeNull();
  });

  it('rejects state that would be unsafe in rendering even when its obvious lists are present', () => {
    const invalid = freshState() as unknown as { meals: Array<Record<string, unknown>> };
    delete invalid.meals[0]?.note;
    expect(normalizeAppState(invalid)).toBeNull();
  });
});
