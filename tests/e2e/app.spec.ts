import { expect, test } from '@playwright/test';
import type { AxeResults } from 'axe-core';

type Axe = { run: (context?: string) => Promise<AxeResults> };

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase('pantry-meal-gap');
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  });
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find the shortest route to dinner.');
});

test('maps pantry amounts and finds a ready meal', async ({ page }) => {
  const add = async (name: string, quantity: string, unit: string) => {
    await page.locator('#pantry-name').fill(name);
    await page.locator('#pantry-quantity').fill(quantity);
    await page.locator('#pantry-unit').selectOption(unit);
    await page.getByRole('button', { name: 'Add to map' }).click();
  };
  await add('red lentils', '1', 'cup');
  await add('tomatoes', '1', 'can');
  await add('onion', '1', 'item');
  await add('garlic', '2', 'clove');
  await add('water', '2', 'cup');

  await page.locator('#meal-search').fill('Tomato lentil');
  const card = page.locator('.meal-card').filter({ hasText: 'Tomato lentil pot' });
  await expect(card.getByLabel('100% ingredients covered')).toBeVisible();
  await card.getByRole('button', { name: 'View meal' }).click();
  await expect(page.getByText('Ready from your pantry')).toBeVisible();
  await page.getByRole('button', { name: 'Mark as chosen' }).click();
  await expect(page.getByRole('heading', { name: 'Recent routes' })).toBeVisible();

  await page.reload();
  await expect(page.locator('.pantry-row')).toHaveCount(5);
});

test('builds a consolidated missing-items shopping list', async ({ page }) => {
  await page.locator('#meal-search').fill('Garlic pantry pasta');
  await page.getByRole('button', { name: 'View shortest route' }).click();
  await page.getByRole('button', { name: 'Add gaps to list' }).click();
  await expect(page.locator('.shopping-row')).toHaveCount(5);
  await expect(page.getByRole('region', { name: 'Smallest shopping list' }).getByText('Pasta', { exact: true })).toBeVisible();
  await page.locator('.shopping-row').first().getByRole('checkbox').check();
  await expect(page.getByRole('button', { name: 'Remove checked' })).toBeVisible();
});

test('adds a custom meal with substitutions', async ({ page }) => {
  await page.getByRole('button', { name: 'Add your meal' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add your meal' });
  await dialog.locator('#meal-name').fill('Thursday toast');
  const firstRow = dialog.locator('.ingredient-row').first();
  await firstRow.locator('[name="ingredient-name"]').fill('bread');
  await firstRow.locator('[name="ingredient-quantity"]').fill('2');
  await firstRow.locator('[name="ingredient-unit"]').selectOption('slice');
  await firstRow.locator('[name="ingredient-swaps"]').fill('flatbread');
  const otherRows = dialog.locator('.ingredient-row').nth(1);
  await otherRows.getByRole('button', { name: 'Remove ingredient row' }).click();
  await dialog.locator('.ingredient-row').nth(1).getByRole('button', { name: 'Remove ingredient row' }).click();
  await dialog.getByRole('button', { name: 'Save meal' }).click();
  await page.locator('#meal-search').fill('Thursday toast');
  await expect(page.locator('.meal-card').filter({ hasText: 'Thursday toast' })).toBeVisible();
});

test('labels every dynamically created custom-meal control and has no serious or critical dialog axe findings', async ({ page }) => {
  await page.getByRole('button', { name: 'Add your meal' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add your meal' });

  for (const rowNumber of [1, 2, 3]) {
    await expect(dialog.getByLabel(`Ingredient ${rowNumber}`, { exact: true })).toBeVisible();
    await expect(dialog.getByLabel(`Amount ${rowNumber}`, { exact: true })).toBeVisible();
    await expect(dialog.getByLabel(`Unit ${rowNumber}`, { exact: true })).toBeVisible();
    await expect(dialog.getByLabel(`Accept instead ${rowNumber} optional`, { exact: true })).toBeVisible();
  }

  await dialog.getByRole('button', { name: 'Add ingredient row' }).click();
  await expect(dialog.getByLabel('Ingredient 4', { exact: true })).toBeVisible();
  await expect(dialog.getByLabel('Unit 4', { exact: true })).toBeVisible();

  await page.addScriptTag({ path: './node_modules/axe-core/axe.min.js' });
  const results = await page.evaluate(async () => await (window as unknown as { axe: Axe }).axe.run('#meal-dialog'));
  const important = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
  expect(important).toEqual([]);
});

test('has no serious or critical axe findings', async ({ page }) => {
  await page.addScriptTag({ path: './node_modules/axe-core/axe.min.js' });
  const results = await page.evaluate(async () => await (window as unknown as { axe: Axe }).axe.run());
  const important = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
  expect(important).toEqual([]);
  await page.getByRole('button', { name: 'Switch color theme' }).click();
  const darkResults = await page.evaluate(async () => await (window as unknown as { axe: Axe }).axe.run());
  const importantDark = darkResults.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
  expect(importantDark).toEqual([]);
});

test('loads without console or runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.reload({ waitUntil: 'networkidle' });
  expect(errors).toEqual([]);
});

test('legal pages have one h1 and the expected local-data policy', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByText('Your ingredient names and meal templates do not leave this browser.')).toBeVisible();
  await page.goto('/terms/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Important limits' })).toBeVisible();
});

test('reloads the complete app while offline after first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find the shortest route to dinner.');
  await expect(page.getByText('Offline field mode.')).toBeVisible();
  await context.setOffline(false);
});
