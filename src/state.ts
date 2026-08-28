import { UNITS, type AppState, type Meal, type MealIngredient, type PantryItem, type RouteHistory, type ShoppingItem, type Unit } from './types';

type RecordValue = Record<string, unknown>;

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
const MAX_NAME_LENGTH = 160;
const MAX_NOTE_LENGTH = 500;
const MAX_LIST_ITEMS = 1_000;
const MAX_TIMESTAMP = 8.64e15;

function record(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function hasOnlyKeys(value: RecordValue, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key)) && keys.every((key) => Object.hasOwn(value, key));
}

function string(value: unknown, maximum = MAX_NAME_LENGTH, allowEmpty = false): value is string {
  return typeof value === 'string' && value.length <= maximum && (allowEmpty || value.trim().length > 0);
}

function identifier(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value);
}

function positiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function timestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_TIMESTAMP;
}

function unit(value: unknown): value is Unit {
  return typeof value === 'string' && UNITS.includes(value as Unit);
}

function stringList(value: unknown, maximumItems = 100): value is string[] {
  return Array.isArray(value) && value.length <= maximumItems && value.every((entry) => string(entry));
}

function pantryItem(value: unknown): value is PantryItem {
  return record(value) && hasOnlyKeys(value, ['id', 'name', 'quantity', 'unit', 'updatedAt'])
    && identifier(value.id) && string(value.name, 60) && positiveNumber(value.quantity) && unit(value.unit) && timestamp(value.updatedAt);
}

function mealIngredient(value: unknown): value is MealIngredient {
  return record(value) && hasOnlyKeys(value, ['id', 'name', 'quantity', 'unit', 'substitutions'])
    && identifier(value.id) && string(value.name, 60) && positiveNumber(value.quantity) && unit(value.unit) && stringList(value.substitutions, 30);
}

function meal(value: unknown): value is Meal {
  return record(value) && hasOnlyKeys(value, ['id', 'name', 'note', 'tags', 'ingredients', 'starter', 'updatedAt'])
    && identifier(value.id) && string(value.name, 80) && string(value.note, 180, true) && stringList(value.tags, 30)
    && Array.isArray(value.ingredients) && value.ingredients.length > 0 && value.ingredients.length <= 100 && value.ingredients.every(mealIngredient)
    && typeof value.starter === 'boolean' && timestamp(value.updatedAt);
}

function shoppingItem(value: unknown): value is ShoppingItem {
  return record(value) && hasOnlyKeys(value, ['id', 'name', 'quantity', 'unit', 'checked', 'sourceMealIds', 'updatedAt'])
    && identifier(value.id) && string(value.name, 60) && positiveNumber(value.quantity) && unit(value.unit)
    && typeof value.checked === 'boolean' && stringList(value.sourceMealIds, 100) && value.sourceMealIds.every(identifier) && timestamp(value.updatedAt);
}

function routeHistory(value: unknown): value is RouteHistory {
  return record(value) && hasOnlyKeys(value, ['id', 'mealName', 'gapCount', 'createdAt'])
    && identifier(value.id) && string(value.mealName, 80) && typeof value.gapCount === 'number' && Number.isInteger(value.gapCount) && value.gapCount >= 0 && timestamp(value.createdAt);
}

function uniqueIds(items: Array<{ id: string }>): boolean {
  return new Set(items.map((item) => item.id)).size === items.length;
}

/**
 * Accept only the versioned shape this app itself persists. The clone removes
 * prototypes so imported JSON cannot retain a surprising object shape.
 */
export function normalizeAppState(value: unknown): AppState | null {
  if (!record(value) || !hasOnlyKeys(value, ['pantry', 'meals', 'shopping', 'history', 'seeded', 'updatedAt'])) return null;
  const { pantry, meals, shopping, history, seeded, updatedAt } = value;
  if (!Array.isArray(pantry) || pantry.length > MAX_LIST_ITEMS || !pantry.every(pantryItem)
    || !Array.isArray(meals) || meals.length > MAX_LIST_ITEMS || !meals.every(meal)
    || !Array.isArray(shopping) || shopping.length > MAX_LIST_ITEMS || !shopping.every(shoppingItem)
    || !Array.isArray(history) || history.length > MAX_LIST_ITEMS || !history.every(routeHistory)
    || typeof seeded !== 'boolean' || !timestamp(updatedAt)
    || !uniqueIds(pantry) || !uniqueIds(meals) || !uniqueIds(shopping) || !uniqueIds(history)) return null;

  return structuredClone({ pantry, meals, shopping, history, seeded, updatedAt });
}

export function parseBackup(value: unknown): AppState | null {
  if (!record(value) || !hasOnlyKeys(value, ['product', 'version', 'exportedAt', 'data'])) return null;
  if (value.product !== 'pantry-meal-gap' || value.version !== 1 || typeof value.exportedAt !== 'string' || Number.isNaN(Date.parse(value.exportedAt))) return null;
  return normalizeAppState(value.data);
}
