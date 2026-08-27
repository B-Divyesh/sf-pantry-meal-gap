export const UNITS = ['item', 'g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'can', 'clove', 'slice', 'handful'] as const;
export type Unit = typeof UNITS[number];

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  updatedAt: number;
}

export interface MealIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  substitutions: string[];
}

export interface Meal {
  id: string;
  name: string;
  note: string;
  tags: string[];
  ingredients: MealIngredient[];
  starter: boolean;
  updatedAt: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  checked: boolean;
  sourceMealIds: string[];
  updatedAt: number;
}

export interface RouteHistory {
  id: string;
  mealName: string;
  gapCount: number;
  createdAt: number;
}

export interface AppState {
  pantry: PantryItem[];
  meals: Meal[];
  shopping: ShoppingItem[];
  history: RouteHistory[];
  seeded: boolean;
  updatedAt: number;
}

export interface GapItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: Unit;
}

export interface IngredientMatch {
  ingredientId: string;
  requiredName: string;
  usedName: string | null;
  coverage: number;
  substitution: boolean;
}

export interface MatchResult {
  score: number;
  missing: GapItem[];
  matches: IngredientMatch[];
  substitutionCount: number;
}
