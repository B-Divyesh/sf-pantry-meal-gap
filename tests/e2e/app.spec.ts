import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { AxeResults } from 'axe-core';

type Axe = { run: (context?: string) => Promise<AxeResults> };

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async (names) => {
    await Promise.all(names.map((name) => new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    })));
  }, ['pantry-meal-gap', 'demo:pantry-meal-gap']);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your smallest missing shopping list');
});

async function openDemo(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/demo/');
  await expect(page).toHaveTitle('Demo — Pantry Meal Gap');
  await expect(page.getByLabel('Demo controls')).toContainText('Demo — sample data, nothing is saved to your real pantry.');
}

test('maps pantry amounts and finds a ready meal', async ({ page }) => {
  const add = async (name: string, quantity: string, unit: string) => {
    await page.locator('#pantry-name').fill(name);
    await page.locator('#pantry-quantity').fill(quantity);
    await page.locator('#pantry-unit').selectOption(unit);
    await page.getByRole('button', { name: 'Add ingredient' }).click();
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
  await expect(page.getByRole('heading', { name: 'Recent choices' })).toBeVisible();

  await page.reload();
  await expect(page.locator('.pantry-row')).toHaveCount(5);
});

test('builds a consolidated missing-items shopping list', async ({ page }) => {
  await page.locator('#meal-search').fill('Garlic pantry pasta');
  await page.getByRole('button', { name: 'See missing items' }).click();
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

test('rejects the verifier malformed backup without replacing a usable map after reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.locator('#pantry-name').fill('rice');
  await page.getByRole('button', { name: 'Add ingredient' }).click();
  await expect(page.locator('.pantry-row')).toHaveCount(1);

  // Exact payload from the independent verifier: it lacks version and fields
  // that rendering needs. It must fail before confirmation or IndexedDB write.
  const malformed = '{"product":"pantry-meal-gap","data":{"seeded":true,"pantry":[],"meals":[{"id":"bad-meal","name":"Malformed backup","ingredients":[{"id":"bad-ingredient","name":"rice","quantity":1,"unit":"cup","substitutions":[]}]}],"shopping":[],"history":[]}}';
  let confirmationRequested = false;
  page.on('dialog', (dialog) => {
    confirmationRequested = true;
    void dialog.dismiss();
  });
  await page.locator('#import-data').setInputFiles({ name: 'verifier-malformed.json', mimeType: 'application/json', buffer: Buffer.from(malformed) });
  await expect(page.getByText('That file is not a valid Pantry Meal Gap backup.')).toBeVisible();
  expect(confirmationRequested).toBe(false);

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your smallest missing shopping list');
  await expect(page.locator('.pantry-row')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('recovers a corrupted IndexedDB record to a usable starter map', async ({ page }) => {
  await page.evaluate(async () => {
    const malformed = {
      seeded: true,
      pantry: [],
      meals: [{ id: 'bad-meal', name: 'Malformed backup', ingredients: [{ id: 'bad-ingredient', name: 'rice', quantity: 1, unit: 'cup', substitutions: [] }] }],
      shopping: [],
      history: []
    };
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('pantry-meal-gap', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('state', 'readwrite');
        transaction.objectStore('state').put(malformed, 'current');
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  });

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your smallest missing shopping list');
  await expect(page.getByText('Damaged local data was reset to a safe starter pantry.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your smallest missing shopping list');
  await expect(page.locator('.meal-card')).toHaveCount(20);
});

test('keeps the keyboard pantry flow and 390px field sheet usable', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth }))).toEqual({ documentWidth: 390, viewportWidth: 390 });

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveCSS('outline-width', '3px');

  await page.locator('#pantry-name').focus();
  await page.keyboard.type('keyboard beans');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Control+A');
  await page.keyboard.type('1');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Keyboard Beans', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('keeps visible links and buttons at least 44 by 44 pixels', async ({ page }) => {
  await page.goto('/demo/');
  const undersized = await page.locator('a, button').evaluateAll((elements) => elements
    .filter((element) => element.getClientRects().length > 0 && !element.closest('[hidden]'))
    .map((element) => {
      const box = element.getBoundingClientRect();
      return { label: (element.textContent ?? element.getAttribute('aria-label') ?? '').trim(), width: box.width, height: box.height };
    })
    .filter((target) => target.width < 44 || target.height < 44));
  expect(undersized).toEqual([]);
});

test('legal pages have one h1 and the expected local-data policy', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByText('Your ingredient names and meal templates do not leave this browser.')).toBeVisible();
  await page.goto('/terms/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Important limits' })).toBeVisible();
});

test('gives advertised routes their own metadata and a usable not-found page', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page).toHaveTitle('Demo — Pantry Meal Gap');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://pantry-meal-gap.sociobot.in/demo/');
  await page.goto('/privacy/');
  await expect(page).toHaveTitle('Privacy — Pantry Meal Gap');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://pantry-meal-gap.sociobot.in/privacy/');
  await page.goto('/404.html');
  await expect(page).toHaveTitle('Page not found — Pantry Meal Gap');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page is not here');
  await expect(page.getByRole('link', { name: 'Go to Pantry Meal Gap' })).toHaveAttribute('href', '/');
});

test('reloads the complete app while offline after first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your smallest missing shopping list');
  await expect(page.getByText('Offline mode.')).toBeVisible();
  await context.setOffline(false);
});

test('@claim:demo-isolation sample data stays separate from your pantry', async ({ page }) => {
  await openDemo(page);
  await expect(page.locator('.pantry-row')).toHaveCount(10);
  await expect(page.locator('.shopping-row')).toHaveCount(3);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('.pantry-row')).toHaveCount(10);
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your smallest missing shopping list');
  await expect(page.locator('.pantry-row')).toHaveCount(0);
  await expect(page.locator('.shopping-row')).toHaveCount(0);
});

test('@claim:free-sample the sample works without an account', async ({ page }) => {
  await openDemo(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your smallest missing shopping list');
  await expect(page.getByText('Tomato lentil pot', { exact: true })).toBeVisible();
  await expect(page.locator('.shopping-row')).toHaveCount(3);
  await expect(page.getByRole('button', { name: /sign in|create account|checkout/i })).toHaveCount(0);
});

test('@claim:offline-reload works offline after the first visit', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4173/?demo=1');
    await expect(page).toHaveTitle('Demo — Pantry Meal Gap');
    await expect(page.getByLabel('Demo controls')).toBeVisible();
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
    await context.setOffline(true);
    const navigated = page.waitForEvent('framenavigated', { timeout: 5_000 });
    void page.evaluate(() => location.reload()).catch(() => undefined);
    await navigated;
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your smallest missing shopping list');
    await expect(page.locator('.pantry-row')).toHaveCount(10);
    await expect(page.getByText('Offline mode.')).toBeVisible();
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});

test('@claim:local-persistence changes save in this browser', async ({ page }) => {
  await openDemo(page);
  await page.locator('#pantry-name').fill('coconut milk');
  await page.locator('#pantry-quantity').fill('1');
  await page.locator('#pantry-unit').selectOption('can');
  await page.getByRole('button', { name: 'Add ingredient' }).click();
  await expect(page.getByText('Coconut Milk', { exact: true })).toBeVisible();
  await page.waitForTimeout(250);
  await page.reload();
  await expect(page.getByText('Coconut Milk', { exact: true })).toBeVisible();
});

test('@claim:private-data entries do not leave this browser', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openDemo(page);
  await page.locator('#pantry-name').fill('coriander');
  await page.getByRole('button', { name: 'Add ingredient' }).click();
  await page.waitForTimeout(250);
  const origin = new URL(page.url()).origin;
  expect(requests.every((url) => new URL(url).origin === origin)).toBe(true);
  await expect(page.getByText('Coriander', { exact: true })).toBeVisible();
});

test('@claim:starter-meals includes twenty editable starter meals', async ({ page }) => {
  await openDemo(page);
  await expect(page.locator('.meal-card')).toHaveCount(20);
  const card = page.locator('.meal-card').filter({ hasText: 'Tomato lentil pot' });
  await card.getByRole('button', { name: 'View meal' }).click();
  await page.getByRole('button', { name: 'Edit meal' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit your meal' });
  await dialog.locator('#meal-name').fill('Updated tomato lentil pot');
  await dialog.getByRole('button', { name: 'Save meal' }).click();
  await page.locator('#meal-search').fill('Updated tomato lentil');
  await expect(page.getByText('Updated tomato lentil pot', { exact: true })).toBeVisible();
});

test('@claim:quantity-conversion matches partial quantities and compatible units', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Add your meal' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add your meal' });
  await dialog.locator('#meal-name').fill('Metric rice bowl');
  const firstRow = dialog.locator('.ingredient-row').first();
  await firstRow.locator('[name="ingredient-name"]').fill('rice');
  await firstRow.locator('[name="ingredient-quantity"]').fill('500');
  await firstRow.locator('[name="ingredient-unit"]').selectOption('g');
  await dialog.locator('.ingredient-row').nth(1).getByRole('button', { name: 'Remove ingredient row' }).click();
  await dialog.locator('.ingredient-row').nth(1).getByRole('button', { name: 'Remove ingredient row' }).click();
  await dialog.getByRole('button', { name: 'Save meal' }).click();
  await page.locator('#pantry-name').fill('rice');
  await page.locator('#pantry-quantity').fill('0.25');
  await page.locator('#pantry-unit').selectOption('kg');
  await page.getByRole('button', { name: 'Add ingredient' }).click();
  await page.locator('#meal-search').fill('Metric rice');
  const card = page.locator('.meal-card').filter({ hasText: 'Metric rice bowl' });
  await expect(card.getByLabel('50% ingredients covered')).toBeVisible();
  await page.locator('#pantry-name').fill('rice');
  await page.locator('#pantry-quantity').fill('0.25');
  await page.locator('#pantry-unit').selectOption('kg');
  await page.getByRole('button', { name: 'Add ingredient' }).click();
  await expect(card.getByLabel('100% ingredients covered')).toBeVisible();
});

test('@claim:substitutions uses the substitutions you choose', async ({ page }) => {
  await openDemo(page);
  const card = page.locator('.meal-card').filter({ hasText: 'Tomato lentil pot' });
  await expect(card.getByLabel('100% ingredients covered')).toBeVisible();
  await card.getByRole('button', { name: 'View meal' }).click();
  await expect(page.getByText('Using Water', { exact: true })).toBeVisible();
});

test('@claim:csv-export exports the sample shopping list as CSV', async ({ page }) => {
  await openDemo(page);
  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export CSV' }).click()
  ]).then(([event]) => event);
  const path = await download.path();
  expect(path).not.toBeNull();
  const csv = await readFile(path!, 'utf8');
  const rows = csv.trim().split('\n');
  expect(rows[0]).toBe('"ingredient","quantity","unit","checked"');
  expect(rows).toHaveLength(4);
  expect(csv).toContain('"pasta","250","g","false"');
});

test('@claim:copy-list copies the sample shopping list', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openDemo(page);
  await page.getByRole('button', { name: 'Copy list' }).click();
  await expect(page.getByText('Shopping list copied.')).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Pasta — 250 g');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Chilli Flakes — 1 tsp');
});

test('@claim:backup-export exports a complete JSON backup', async ({ page }) => {
  await openDemo(page);
  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export backup' }).click()
  ]).then(([event]) => event);
  const path = await download.path();
  expect(path).not.toBeNull();
  const backup = JSON.parse(await readFile(path!, 'utf8')) as { product: string; version: number; data: { pantry: unknown[]; shopping: unknown[] } };
  expect(backup.product).toBe('pantry-meal-gap');
  expect(backup.version).toBe(1);
  expect(backup.data.pantry).toHaveLength(10);
  expect(backup.data.shopping).toHaveLength(3);
});

test('@claim:missing-list shows the missing items for a selected meal', async ({ page }) => {
  await openDemo(page);
  await page.locator('#meal-search').fill('Garlic pantry pasta');
  await page.getByRole('button', { name: 'See missing items' }).click();
  await expect(page.getByRole('dialog', { name: 'Garlic pantry pasta' }).getByText('3 items missing', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add gaps to list' }).click();
  const list = page.getByRole('region', { name: 'Smallest shopping list' });
  await expect(list.getByText('Pasta', { exact: true })).toBeVisible();
  await expect(list.getByText('Chilli Flakes', { exact: true })).toBeVisible();
  await expect(list.getByText('Parsley', { exact: true })).toBeVisible();
});

test('@claim:validated-import rejects invalid backups before replacing sample data', async ({ page }) => {
  await openDemo(page);
  const malformed = '{"product":"pantry-meal-gap","data":{"seeded":true,"pantry":[],"meals":[],"shopping":[],"history":[]}}';
  let confirmationRequested = false;
  page.on('dialog', (dialog) => { confirmationRequested = true; void dialog.dismiss(); });
  await page.locator('#import-data').setInputFiles({ name: 'bad-backup.json', mimeType: 'application/json', buffer: Buffer.from(malformed) });
  await expect(page.getByText('That file is not a valid Pantry Meal Gap backup.')).toBeVisible();
  expect(confirmationRequested).toBe(false);
  await expect(page.locator('.pantry-row')).toHaveCount(10);
  await expect(page.locator('.shopping-row')).toHaveCount(3);
});
