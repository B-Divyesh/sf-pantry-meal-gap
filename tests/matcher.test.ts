import { describe, expect, it } from 'vitest';
import { STARTER_MEALS } from '../src/data';
import { matchMeal, normalizeName } from '../src/matcher';
import type { Meal, PantryItem } from '../src/types';

const meal: Meal = {
  id: 'meal',
  name: 'Test meal',
  note: '',
  tags: [],
  starter: false,
  updatedAt: 1,
  ingredients: [
    { id: 'rice', name: 'rice', quantity: 500, unit: 'g', substitutions: ['quinoa'] },
    { id: 'oil', name: 'olive oil', quantity: 2, unit: 'tbsp', substitutions: ['vegetable oil'] }
  ]
};

const pantry = (...items: Array<[string, number, PantryItem['unit']]>): PantryItem[] => items.map(([name, quantity, unit], index) => ({ id: String(index), name, quantity, unit, updatedAt: 1 }));

describe('meal gap matching', () => {
  it('ships exactly twenty editable starter meal templates', () => {
    expect(STARTER_MEALS).toHaveLength(20);
    expect(STARTER_MEALS.every((entry) => entry.starter && entry.ingredients.length > 0)).toBe(true);
  });

  it('matches names without case or whitespace sensitivity', () => {
    const result = matchMeal(meal, pantry(['  RICE ', 500, 'g'], ['Olive Oil', 2, 'tbsp']));
    expect(result.score).toBe(100);
    expect(result.missing).toEqual([]);
  });

  it('calculates partial quantities and converts compatible units', () => {
    const result = matchMeal(meal, pantry(['rice', 0.25, 'kg'], ['olive oil', 15, 'ml']));
    expect(result.score).toBe(50);
    expect(result.missing).toEqual([
      { ingredientId: 'rice', name: 'rice', quantity: 250, unit: 'g' },
      { ingredientId: 'oil', name: 'olive oil', quantity: 1, unit: 'tbsp' }
    ]);
  });

  it('uses accepted substitutions and reports them', () => {
    const result = matchMeal(meal, pantry(['quinoa', 500, 'g'], ['vegetable oil', 2, 'tbsp']));
    expect(result.score).toBe(100);
    expect(result.substitutionCount).toBe(2);
    expect(result.matches.every((entry) => entry.substitution)).toBe(true);
  });

  it('does not allocate the same pantry quantity twice', () => {
    const doubled: Meal = { ...meal, ingredients: [meal.ingredients[0]!, { ...meal.ingredients[0]!, id: 'rice-2' }] };
    const result = matchMeal(doubled, pantry(['rice', 500, 'g']));
    expect(result.score).toBe(50);
    expect(result.missing).toHaveLength(1);
  });

  it('normalizes internal whitespace', () => {
    expect(normalizeName('  Black   Beans ')).toBe('black beans');
  });
});
