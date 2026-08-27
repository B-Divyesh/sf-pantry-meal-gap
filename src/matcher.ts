import type { GapItem, IngredientMatch, MatchResult, Meal, PantryItem, Unit } from './types';

const UNIT_BASE: Partial<Record<Unit, { kind: string; factor: number }>> = {
  g: { kind: 'weight', factor: 1 },
  kg: { kind: 'weight', factor: 1000 },
  ml: { kind: 'volume', factor: 1 },
  l: { kind: 'volume', factor: 1000 },
  tsp: { kind: 'volume', factor: 5 },
  tbsp: { kind: 'volume', factor: 15 },
  cup: { kind: 'volume', factor: 240 }
};

export function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

function compatibleAmount(quantity: number, from: Unit, to: Unit): number | null {
  if (from === to) return quantity;
  const source = UNIT_BASE[from];
  const target = UNIT_BASE[to];
  if (!source || !target || source.kind !== target.kind) return null;
  return (quantity * source.factor) / target.factor;
}

function rounded(value: number): number {
  return Math.round(value * 100) / 100;
}

export function matchMeal(meal: Meal, pantry: PantryItem[]): MatchResult {
  const remaining = new Map<string, PantryItem & { remaining: number }>();
  for (const item of pantry) {
    const key = normalizeName(item.name);
    const existing = remaining.get(key);
    if (existing && existing.unit === item.unit) {
      existing.remaining += item.quantity;
    } else if (!existing) {
      remaining.set(key, { ...item, remaining: item.quantity });
    }
  }

  const missing: GapItem[] = [];
  const matches: IngredientMatch[] = [];
  let coverageTotal = 0;
  let substitutionCount = 0;

  for (const requirement of meal.ingredients) {
    const candidates = [requirement.name, ...requirement.substitutions];
    let selected: (PantryItem & { remaining: number }) | undefined;
    let selectedName = '';

    for (const name of candidates) {
      const candidate = remaining.get(normalizeName(name));
      if (candidate && compatibleAmount(candidate.remaining, candidate.unit, requirement.unit) !== null) {
        selected = candidate;
        selectedName = name;
        break;
      }
    }

    let coverage = 0;
    if (selected) {
      const amountInRequiredUnit = compatibleAmount(selected.remaining, selected.unit, requirement.unit) ?? 0;
      coverage = Math.min(1, amountInRequiredUnit / requirement.quantity);
      const consumedInPantryUnit = compatibleAmount(requirement.quantity * coverage, requirement.unit, selected.unit) ?? 0;
      selected.remaining = Math.max(0, selected.remaining - consumedInPantryUnit);
      if (normalizeName(selectedName) !== normalizeName(requirement.name) && coverage > 0) substitutionCount += 1;
    }

    coverageTotal += coverage;
    const missingQuantity = rounded(requirement.quantity * (1 - coverage));
    if (missingQuantity > 0) {
      missing.push({ ingredientId: requirement.id, name: requirement.name, quantity: missingQuantity, unit: requirement.unit });
    }
    matches.push({
      ingredientId: requirement.id,
      requiredName: requirement.name,
      usedName: selected && coverage > 0 ? selected.name : null,
      coverage,
      substitution: Boolean(selected && normalizeName(selectedName) !== normalizeName(requirement.name) && coverage > 0)
    });
  }

  const score = meal.ingredients.length ? Math.round((coverageTotal / meal.ingredients.length) * 100) : 0;
  return { score, missing, matches, substitutionCount };
}

export function formatQuantity(quantity: number, unit: Unit): string {
  const amount = Number.isInteger(quantity) ? String(quantity) : String(Math.round(quantity * 100) / 100);
  return `${amount} ${unit}`;
}
