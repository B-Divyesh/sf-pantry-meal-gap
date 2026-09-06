import './styles.css';
import { freshDemoState, freshState, STARTER_MEALS } from './data';
import { clearState, loadState, saveState, type StorageScope } from './db';
import { formatQuantity, matchMeal, normalizeName } from './matcher';
import { normalizeAppState, parseBackup } from './state';
import { UNITS, type AppState, type Meal, type MealIngredient, type PantryItem, type ShoppingItem, type Unit } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
if (!app) throw new Error('The application root is missing.');

let state: AppState = freshState();
let query = '';
let sortMode: 'closest' | 'name' = 'closest';
let editingMealId: string | null = null;
let undoAction: (() => void) | null = null;
let saveTimer = 0;
const DEMO_ROUTE_MARKER = 'pantry-meal-gap-demo-route';
const demoRequested = location.pathname === '/demo' || location.pathname.startsWith('/demo/') || new URLSearchParams(location.search).get('demo') === '1';
let resumeDemoOffline = false;
try {
  if (demoRequested) sessionStorage.setItem(DEMO_ROUTE_MARKER, '1');
  else if (!navigator.onLine && sessionStorage.getItem(DEMO_ROUTE_MARKER) === '1') resumeDemoOffline = true;
  else sessionStorage.removeItem(DEMO_ROUTE_MARKER);
} catch { /* Demo remains available when session storage is blocked. */ }
const isDemo = demoRequested || resumeDemoOffline;
const storageScope: StorageScope = isDemo ? 'demo' : 'real';

if (isDemo) document.title = 'Demo — Pantry Meal Gap';

const e = (value: string): string => value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
const id = (): string => crypto.randomUUID();
const titleCase = (value: string): string => value.replace(/\b\w/g, (letter) => letter.toUpperCase());
const unitOptions = (selected: Unit = 'item'): string => UNITS.map((unit) => `<option value="${unit}"${unit === selected ? ' selected' : ''}>${unit}</option>`).join('');

function legalShell(title: string, intro: string, body: string): string {
  return `
    ${headerMarkup()}
    <main id="main" class="legal-page">
      <p class="eyebrow">Updated 6 September 2026</p>
      <h1>${title}</h1>
      <p class="legal-intro">${intro}</p>
      ${body}
    </main>
    ${footerMarkup()}`;
}

function renderLegalPage(): boolean {
  if (location.pathname.startsWith('/privacy')) {
    app.innerHTML = legalShell('Privacy for your pantry data', 'Your ingredient names and meal templates do not leave this browser.', `
      <section><h2>What is stored</h2><p>Your pantry items, meal templates, shopping list, and recent meal choices are stored in IndexedDB on this device. Theme preference is stored in local storage. We do not run analytics, advertising, fingerprinting, or third-party tracking.</p></section>
      <section><h2>What is sent</h2><p>Nothing you enter is sent to Pantry Meal Gap or to a third party. After the app loads once, it works offline. The illustration is bundled with the app.</p></section>
      <section><h2>Your controls</h2><p>Use “Export backup” in the app to download your data. Import replaces local data only after validation. Clearing site data removes the local database. We cannot recover erased data because there is no account or server copy.</p></section>
      <section><h2>Contact</h2><p>For privacy questions, contact <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p></section>`);
    return true;
  }
  if (location.pathname.startsWith('/terms')) {
    app.innerHTML = legalShell('Terms for using Pantry Meal Gap', 'Use Pantry Meal Gap to plan meals and shopping. You remain responsible for food safety, quantities, substitutions, and allergy suitability.', `
      <section><h2>Use of the service</h2><p>You may use, modify, and export the meal templates you create. The included starter templates are ingredient checklists, not complete recipes or professional nutrition advice.</p></section>
      <section><h2>Important limits</h2><p>Ingredient matching is based on names, units, and quantities you provide. It cannot verify freshness, cross-contamination, allergens, safe cooking temperatures, or whether a substitution works for your dietary needs.</p></section>
      <section><h2>Availability</h2><p>The app is provided “as is” without warranties. Offline use needs a successful first load and browser storage support. Keep exports if the data matters to you.</p></section>
      <section><h2>Contact</h2><p>Questions may be sent to <a href="mailto:hello@sociobot.in">hello@sociobot.in</a>.</p></section>`);
    return true;
  }
  return false;
}

function headerMarkup(): string {
  const pantryHref = isDemo ? '/demo/#pantry' : '/#pantry';
  const mealsHref = isDemo ? '/demo/#meals' : '/#meals';
  return `
    <header class="site-header">
      <a class="brand" href="/" aria-label="Pantry Meal Gap home">
        <span class="brand-mark" aria-hidden="true"><i></i></span>
        <span>Pantry Meal Gap</span>
      </a>
      <nav aria-label="Primary">
        <a href="/demo/">Demo</a>
        <a href="${pantryHref}">Pantry</a>
        <a href="${mealsHref}">Meals</a>
        <a href="/privacy/">Privacy</a>
      </nav>
      <button class="icon-button theme-toggle" type="button" aria-label="Switch color theme" title="Switch color theme">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9c-4.8 2.2-11.2-4.2-9-9Z"/></svg>
      </button>
    </header>`;
}

function heroMarkup(): string {
  const ready = state.meals.map((meal) => matchMeal(meal, state.pantry)).filter((result) => result.missing.length === 0).length;
  const closest = [...state.meals].sort((a, b) => matchMeal(b, state.pantry).score - matchMeal(a, state.pantry).score)[0];
  const closestResult = closest ? matchMeal(closest, state.pantry) : null;
  return `
    <section class="hero" id="top" aria-labelledby="page-title">
      <div class="hero-copy">
        <p class="eyebrow">Pantry Meal Gap</p>
        <h1 id="page-title">Find your smallest missing shopping list</h1>
        <p class="hero-lede">For home cooks choosing dinner from what they have.</p>
        <div class="hero-actions">
          ${isDemo ? '<button class="button primary" data-reset-demo type="button">Reset sample</button>' : '<a class="button primary" href="/demo/">Try it with sample data</a>'}
          <a class="button secondary" href="#pantry">Start with my pantry</a>
        </div>
        <p class="action-result">${isDemo ? 'Reset the sample pantry, meal matches, and shopping list.' : 'See a filled pantry, meal matches, and shopping list.'}</p>
        <ul class="plain-facts" aria-label="Product facts"><li>Private: saved in this browser.</li><li>Offline: works after your first visit.</li><li>Free: no account needed.</li></ul>
        <dl class="field-stats" aria-label="Current pantry summary">
          <div><dt>On hand</dt><dd>${state.pantry.length}</dd></div>
          <div><dt>Ready now</dt><dd>${ready}</dd></div>
          <div><dt>Fewest missing</dt><dd>${closestResult ? closestResult.missing.length : '—'}</dd></div>
        </dl>
      </div>
      <figure class="hero-map">
        <picture>
          <source type="image/avif" srcset="/assets/pantry-map-768.avif 768w, /assets/pantry-map-1536.avif 1536w" sizes="(max-width: 760px) 100vw, 48vw" />
          <source type="image/webp" srcset="/assets/pantry-map-768.webp 768w, /assets/pantry-map-1536.webp 1536w" sizes="(max-width: 760px) 100vw, 48vw" />
          <img src="/assets/pantry-map-1536.jpg" srcset="/assets/pantry-map-768.jpg 768w, /assets/pantry-map-1536.jpg 1536w" sizes="(max-width: 760px) 100vw, 48vw" width="1536" height="1024" alt="Rice, beans, tomatoes, herbs and an onion arranged over contour lines, with one empty red circle" decoding="async" fetchpriority="high" />
        </picture>
        <figcaption>A pantry illustration shows a few ingredients and one missing item.</figcaption>
      </figure>
    </section>`;
}

function pantryMarkup(): string {
  const rows = state.pantry.length ? state.pantry
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => `
      <li class="pantry-row" data-pantry-id="${item.id}">
        <span class="pantry-name">${e(titleCase(item.name))}</span>
        <label class="sr-only" for="quantity-${item.id}">Quantity of ${e(item.name)}</label>
        <input id="quantity-${item.id}" class="quantity-input" type="number" min="0.01" step="0.01" value="${item.quantity}" data-pantry-quantity="${item.id}" />
        <label class="sr-only" for="unit-${item.id}">Unit for ${e(item.name)}</label>
        <select id="unit-${item.id}" data-pantry-unit="${item.id}">${unitOptions(item.unit)}</select>
        <button class="icon-button quiet" type="button" data-remove-pantry="${item.id}" aria-label="Remove ${e(item.name)}" title="Remove ${e(item.name)}">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17"/></svg>
        </button>
      </li>`).join('') : `
      <li class="empty-state">
        <span class="empty-contours" aria-hidden="true"></span>
        <strong>Your pantry is empty.</strong>
        <p>Add the ingredients you can actually use tonight. “1 item” is fine when precision does not matter.</p>
      </li>`;
  return `
    <section class="survey-section" id="pantry" aria-labelledby="pantry-title">
      <div class="section-heading">
        <div><p class="map-code">PANTRY</p><h2 id="pantry-title">Add what you have</h2><p>Use practical amounts. Changes save in this browser.</p></div>
        <span class="count-badge">${state.pantry.length} ${state.pantry.length === 1 ? 'item' : 'items'}</span>
      </div>
      <form class="add-pantry-form" id="pantry-form">
        <div class="field ingredient-field"><label for="pantry-name">Ingredient</label><input id="pantry-name" name="name" required maxlength="60" autocomplete="off" placeholder="e.g. chickpeas" /></div>
        <div class="field amount-field"><label for="pantry-quantity">Amount</label><input id="pantry-quantity" name="quantity" type="number" min="0.01" step="0.01" value="1" required /></div>
        <div class="field unit-field"><label for="pantry-unit">Unit</label><select id="pantry-unit" name="unit">${unitOptions()}</select></div>
        <button class="button primary add-button" type="submit"><span aria-hidden="true">＋</span>Add ingredient</button>
      </form>
      <p class="form-message" id="pantry-message" role="status"></p>
      <ul class="pantry-list" aria-label="Ingredients on hand">${rows}</ul>
    </section>`;
}

function mealCard(meal: Meal): string {
  const result = matchMeal(meal, state.pantry);
  const status = result.score === 100 ? 'Ready now' : result.missing.length === 1 ? 'One item missing' : `${result.missing.length} items missing`;
  const missing = result.missing.slice(0, 3).map((gap) => `<li><span>${e(titleCase(gap.name))}</span><small>${formatQuantity(gap.quantity, gap.unit)}</small></li>`).join('');
  return `
    <article class="meal-card" data-score="${result.score}">
      <div class="score-marker" aria-label="${result.score}% ingredients covered"><span>${result.score}</span><small>%</small></div>
      <div class="meal-card-body">
        <div class="meal-card-heading"><div><p class="route-state">${status}</p><h3>${e(meal.name)}</h3></div>${meal.starter ? '<span class="starter-label">Starter</span>' : '<span class="starter-label custom">Yours</span>'}</div>
        <p class="meal-note">${e(meal.note)}</p>
        ${result.missing.length ? `<div class="gap-preview"><span class="gap-label"><i aria-hidden="true"></i> Missing</span><ul>${missing}${result.missing.length > 3 ? `<li><span>+ ${result.missing.length - 3} more</span></li>` : ''}</ul></div>` : '<div class="ready-route"><span aria-hidden="true">✓</span> All ingredients are on hand</div>'}
        <div class="meal-meta"><span>${meal.ingredients.length} ingredients</span><span>${result.substitutionCount ? `${result.substitutionCount} substitution${result.substitutionCount === 1 ? '' : 's'}` : 'Exact names'}</span></div>
        <button class="button route-button" type="button" data-open-meal="${meal.id}">${result.missing.length ? 'See missing items' : 'View meal'}<span aria-hidden="true">↗</span></button>
      </div>
    </article>`;
}

function filteredMeals(): Meal[] {
  const needle = normalizeName(query);
  const meals = state.meals.filter((meal) => !needle || normalizeName(`${meal.name} ${meal.note} ${meal.tags.join(' ')} ${meal.ingredients.map((item) => item.name).join(' ')}`).includes(needle));
  return meals.sort((a, b) => sortMode === 'name' ? a.name.localeCompare(b.name) : matchMeal(b, state.pantry).score - matchMeal(a, state.pantry).score || a.name.localeCompare(b.name));
}

function mealGridMarkup(): string {
  const meals = filteredMeals();
  return meals.length ? meals.map(mealCard).join('') : `<div class="empty-state full-span"><strong>No meals match “${e(query)}”.</strong><p>Try an ingredient name, meal name, or clear the search.</p><button class="button secondary" id="clear-search" type="button">Clear search</button></div>`;
}

function mealsMarkup(): string {
  const missingStarters = STARTER_MEALS.filter((starter) => !state.meals.some((meal) => meal.id === starter.id)).length;
  return `
    <section class="meals-section" id="meals" aria-labelledby="meals-title">
      <div class="section-heading">
        <div><p class="map-code">MEALS</p><h2 id="meals-title">Closest meals</h2><p>Coverage includes partial amounts and substitutions you choose.</p></div>
        <button class="button primary" type="button" id="add-meal">＋ Add your meal</button>
      </div>
      <div class="meal-tools">
        <div class="search-field"><label for="meal-search">Search meals</label><span aria-hidden="true">⌕</span><input id="meal-search" type="search" value="${e(query)}" placeholder="Meal or ingredient" /></div>
        <div class="field sort-field"><label for="meal-sort">Sort by</label><select id="meal-sort"><option value="closest"${sortMode === 'closest' ? ' selected' : ''}>Closest first</option><option value="name"${sortMode === 'name' ? ' selected' : ''}>Name A–Z</option></select></div>
        ${missingStarters ? `<button class="text-button" id="restore-starters" type="button">Restore ${missingStarters} starter${missingStarters === 1 ? '' : 's'}</button>` : ''}
      </div>
      <div class="meal-grid" id="meal-grid" aria-live="polite">${mealGridMarkup()}</div>
    </section>`;
}

function shoppingMarkup(): string {
  const openItems = state.shopping.filter((item) => !item.checked).length;
  const items = state.shopping.length ? state.shopping.map((item) => `
    <li class="shopping-row${item.checked ? ' checked' : ''}">
      <label><input type="checkbox" data-check-shopping="${item.id}"${item.checked ? ' checked' : ''} /><span class="check-box" aria-hidden="true"></span><span><strong>${e(titleCase(item.name))}</strong><small>${formatQuantity(item.quantity, item.unit)}</small></span></label>
      <button class="icon-button quiet" type="button" data-remove-shopping="${item.id}" aria-label="Remove ${e(item.name)} from shopping list"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17"/></svg></button>
    </li>`).join('') : `<li class="empty-state"><span class="route-pin" aria-hidden="true"></span><strong>Your shopping list is empty.</strong><p>Open a meal above and add its missing items. Items from several meals combine here.</p></li>`;
  const history = state.history.length ? `<div class="route-history"><h3>Recent choices</h3><ol>${state.history.slice(0, 4).map((entry) => `<li><span>${e(entry.mealName)}</span><small>${entry.gapCount} missing item${entry.gapCount === 1 ? '' : 's'} · <time datetime="${new Date(entry.createdAt).toISOString()}">${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(entry.createdAt)}</time></small></li>`).join('')}</ol></div>` : '';
  return `
    <section class="shopping-section" id="shopping" aria-labelledby="shopping-title">
      <div class="section-heading">
        <div><p class="map-code">SHOPPING LIST</p><h2 id="shopping-title">Smallest shopping list</h2><p>Items combine by ingredient and unit. Check them off, even offline.</p></div>
        <span class="count-badge marker">${openItems} to pick up</span>
      </div>
      <div class="shopping-layout">
        <div class="shopping-sheet">
          <ul class="shopping-list">${items}</ul>
          ${state.shopping.length ? `<div class="shopping-actions"><button class="button secondary" id="copy-list" type="button">Copy list</button><button class="button secondary" id="download-csv" type="button">Export CSV</button>${state.shopping.some((item) => item.checked) ? '<button class="text-button danger-text" id="clear-checked" type="button">Remove checked</button>' : ''}</div>` : ''}
        </div>
        <section class="data-panel" aria-labelledby="data-title"><p class="map-code">YOUR DATA</p><h3 id="data-title">Keep your data</h3><p>Your entries stay in this browser. Export a JSON backup or import one.</p><div><button class="button secondary" id="export-data" type="button">Export backup</button><label class="button secondary import-label">Import backup<input id="import-data" type="file" accept="application/json,.json" /></label></div><p class="data-note">Import replaces local data only after validation.</p></section>
      </div>
      ${history}
    </section>`;
}

function dialogMarkup(): string {
  return `
    <dialog id="route-dialog" class="route-dialog" aria-labelledby="route-dialog-title"><div id="route-dialog-content"></div></dialog>
    <dialog id="meal-dialog" class="meal-dialog" aria-labelledby="meal-dialog-title">
      <form method="dialog" class="dialog-form" id="meal-form">
        <div class="dialog-heading"><div><p class="map-code">CUSTOM MEAL</p><h2 id="meal-dialog-title">Add your meal</h2></div><button class="icon-button close-dialog" type="button" aria-label="Close meal editor"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17"/></svg></button></div>
        <div class="field"><label for="meal-name">Meal name</label><input id="meal-name" name="name" required maxlength="80" /></div>
        <div class="field"><label for="meal-note">Short note <span>optional</span></label><textarea id="meal-note" name="note" maxlength="180" rows="2"></textarea></div>
        <fieldset><legend>Ingredients and acceptable swaps</legend><p>List usable amounts for this meal. Separate swaps with commas.</p><div id="ingredient-rows"></div><button class="text-button" id="add-ingredient" type="button">＋ Add ingredient row</button></fieldset>
        <p class="form-message" id="meal-message" role="alert"></p>
        <div class="dialog-actions"><button class="button secondary close-dialog" type="button">Cancel</button><button class="button primary" type="submit">Save meal</button></div>
      </form>
    </dialog>`;
}

function footerMarkup(): string {
  return `<footer><div><span class="brand-mark small" aria-hidden="true"><i></i></span><p><strong>Pantry Meal Gap</strong><br />Pantry and meal matching in this browser.</p></div><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="https://github.com/B-Divyesh/sf-pantry-meal-gap" rel="noreferrer">Source <span class="sr-only">(opens GitHub)</span></a></nav><p class="art-note">Built by Param Factory · v1.0.0</p></footer>`;
}

function howItWorksMarkup(): string {
  return `<section class="how-it-works" aria-labelledby="how-it-works-title"><div><p class="map-code">HOW IT WORKS</p><h2 id="how-it-works-title">Choose dinner in three steps</h2></div><ol><li><strong>1. Add ingredients</strong><span>Enter what you can use tonight.</span></li><li><strong>2. Compare meals</strong><span>See the closest meal and accepted substitutions.</span></li><li><strong>3. Shop for gaps</strong><span>Keep only the missing items on your list.</span></li></ol></section>`;
}

function limitsMarkup(): string {
  return `<section class="limits-section" aria-labelledby="limits-title"><div><p class="map-code">PRIVACY AND LIMITS</p><h2 id="limits-title">What Pantry Meal Gap does not do</h2></div><div><p>It does not check food safety, allergies, freshness, or recipes. You decide what is safe and suitable.</p><p>Your entries stay in this browser. <a href="/privacy/">Read the privacy policy</a>.</p></div></section>`;
}

function renderApp(): void {
  const demoBanner = isDemo ? `<aside class="demo-banner" aria-label="Demo controls"><strong>Demo — sample data, nothing is saved to your real pantry.</strong><span><button class="text-button" id="reset-demo" type="button">Reset demo</button><button class="button demo-exit" id="start-real" type="button">Start for real</button></span></aside>` : '';
  app.innerHTML = `${headerMarkup()}${demoBanner}<div class="offline-banner" id="offline-banner" role="status" hidden><strong>Offline mode.</strong> Your pantry and list still work on this device.</div><main id="main">${heroMarkup()}${howItWorksMarkup()}${pantryMarkup()}${mealsMarkup()}${shoppingMarkup()}${limitsMarkup()}</main>${footerMarkup()}${dialogMarkup()}<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>`;
  bindEvents();
  updateOnlineState();
}

function persist(): void {
  state.updatedAt = Date.now();
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveState(state, storageScope).then(() => announce(isDemo ? 'Sample changes saved in the demo.' : 'Saved in this browser.')).catch(() => announce('Could not save. Export a backup before closing.', true));
  }, 120);
}

function announce(message: string, urgent = false, actionLabel?: string): void {
  const toast = document.querySelector<HTMLDivElement>('#toast');
  if (!toast) return;
  toast.classList.toggle('urgent', urgent);
  toast.innerHTML = `<span>${e(message)}</span>${actionLabel ? `<button type="button" id="undo-action">${e(actionLabel)}</button>` : ''}`;
  toast.hidden = false;
  window.setTimeout(() => { if (toast.textContent?.includes(message)) toast.hidden = true; }, actionLabel ? 7000 : 2500);
}

function updateMealGrid(): void {
  const grid = document.querySelector<HTMLDivElement>('#meal-grid');
  if (grid) grid.innerHTML = mealGridMarkup();
}

function updateOnlineState(): void {
  const banner = document.querySelector<HTMLElement>('#offline-banner');
  if (banner) banner.hidden = navigator.onLine;
}

function bindEvents(): void {
  document.querySelector<HTMLButtonElement>('.theme-toggle')?.addEventListener('click', toggleTheme);
  document.querySelector<HTMLFormElement>('#pantry-form')?.addEventListener('submit', addPantryItem);
  document.querySelector<HTMLInputElement>('#meal-search')?.addEventListener('input', (event) => {
    query = (event.currentTarget as HTMLInputElement).value;
    updateMealGrid();
  });
  document.querySelector<HTMLSelectElement>('#meal-sort')?.addEventListener('change', (event) => {
    sortMode = (event.currentTarget as HTMLSelectElement).value as 'closest' | 'name';
    updateMealGrid();
  });
  document.querySelector<HTMLButtonElement>('#add-meal')?.addEventListener('click', () => openMealEditor());
  document.querySelector<HTMLFormElement>('#meal-form')?.addEventListener('submit', saveMealFromForm);
  document.querySelector<HTMLButtonElement>('#add-ingredient')?.addEventListener('click', () => addIngredientRow());
  document.querySelectorAll<HTMLButtonElement>('.close-dialog').forEach((button) => button.addEventListener('click', () => button.closest('dialog')?.close()));
  document.querySelector<HTMLButtonElement>('#restore-starters')?.addEventListener('click', restoreStarters);
  document.querySelector<HTMLButtonElement>('#copy-list')?.addEventListener('click', copyShoppingList);
  document.querySelector<HTMLButtonElement>('#download-csv')?.addEventListener('click', exportShoppingCsv);
  document.querySelector<HTMLButtonElement>('#clear-checked')?.addEventListener('click', clearChecked);
  document.querySelector<HTMLButtonElement>('#export-data')?.addEventListener('click', exportBackup);
  document.querySelector<HTMLInputElement>('#import-data')?.addEventListener('change', importBackup);
  document.querySelectorAll<HTMLButtonElement>('#reset-demo, [data-reset-demo]').forEach((button) => button.addEventListener('click', resetDemo));
  document.querySelector<HTMLButtonElement>('#start-real')?.addEventListener('click', startForReal);
}

function delegatedClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  const mealButton = target.closest<HTMLButtonElement>('[data-open-meal]');
  const pantryButton = target.closest<HTMLButtonElement>('[data-remove-pantry]');
  const shoppingButton = target.closest<HTMLButtonElement>('[data-remove-shopping]');
  if (mealButton) openRoute(mealButton.dataset.openMeal ?? '');
  else if (pantryButton) removePantryItem(pantryButton.dataset.removePantry ?? '');
  else if (shoppingButton) removeShoppingItem(shoppingButton.dataset.removeShopping ?? '');
  else if (target.closest('#clear-search')) {
    query = '';
    const search = document.querySelector<HTMLInputElement>('#meal-search');
    if (search) search.value = '';
    updateMealGrid();
  } else if (target.closest('#undo-action') && undoAction) {
    undoAction();
    undoAction = null;
  }
}

function delegatedChange(event: Event): void {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  if (target.matches('[data-pantry-quantity]')) updatePantryField(target.dataset.pantryQuantity ?? '', 'quantity', Number(target.value));
  if (target.matches('[data-pantry-unit]')) updatePantryField(target.dataset.pantryUnit ?? '', 'unit', target.value as Unit);
  if (target.matches('[data-check-shopping]')) {
    const item = state.shopping.find((entry) => entry.id === target.dataset.checkShopping);
    if (item) {
      item.checked = (target as HTMLInputElement).checked;
      item.updatedAt = Date.now();
      persist();
      renderApp();
    }
  }
}

function addPantryItem(event: SubmitEvent): void {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  const name = normalizeName(String(data.get('name') ?? ''));
  const quantity = Number(data.get('quantity'));
  const unit = String(data.get('unit')) as Unit;
  const message = document.querySelector<HTMLParagraphElement>('#pantry-message');
  if (!name || !Number.isFinite(quantity) || quantity <= 0 || !UNITS.includes(unit)) {
    if (message) message.textContent = 'Enter an ingredient and an amount greater than zero.';
    return;
  }
  const existing = state.pantry.find((item) => normalizeName(item.name) === name && item.unit === unit);
  if (existing) {
    existing.quantity += quantity;
    existing.updatedAt = Date.now();
    announce(`${titleCase(name)} amount updated.`);
  } else {
    state.pantry.push({ id: id(), name, quantity, unit, updatedAt: Date.now() });
    announce(`${titleCase(name)} added to your pantry.`);
  }
  persist();
  renderApp();
  document.querySelector<HTMLInputElement>('#pantry-name')?.focus();
}

function updatePantryField(itemId: string, field: 'quantity' | 'unit', value: number | Unit): void {
  const item = state.pantry.find((entry) => entry.id === itemId);
  if (!item) return;
  if (field === 'quantity' && typeof value === 'number' && value > 0) item.quantity = value;
  if (field === 'unit' && typeof value === 'string' && UNITS.includes(value as Unit)) item.unit = value as Unit;
  item.updatedAt = Date.now();
  persist();
  renderApp();
}

function removePantryItem(itemId: string): void {
  const index = state.pantry.findIndex((item) => item.id === itemId);
  if (index < 0) return;
  const [removed] = state.pantry.splice(index, 1);
  if (!removed) return;
  persist();
  renderApp();
  undoAction = () => {
    state.pantry.splice(index, 0, removed);
    persist();
    renderApp();
    announce(`${titleCase(removed.name)} restored.`);
  };
  announce(`${titleCase(removed.name)} removed.`, false, 'Undo');
}

function openRoute(mealId: string): void {
  const meal = state.meals.find((entry) => entry.id === mealId);
  const dialog = document.querySelector<HTMLDialogElement>('#route-dialog');
  const content = document.querySelector<HTMLDivElement>('#route-dialog-content');
  if (!meal || !dialog || !content) return;
  const result = matchMeal(meal, state.pantry);
  const ingredientRows = meal.ingredients.map((ingredient) => {
    const found = result.matches.find((match) => match.ingredientId === ingredient.id);
    const gap = result.missing.find((item) => item.ingredientId === ingredient.id);
    const detail = found?.substitution ? `Using ${titleCase(found.usedName ?? '')}` : found && found.coverage >= 1 ? 'On hand' : found && found.coverage > 0 ? `${Math.round(found.coverage * 100)}% on hand` : ingredient.substitutions.length ? `Swap: ${ingredient.substitutions.map(titleCase).join(' or ')}` : 'Missing';
    return `<li class="route-ingredient ${gap ? 'has-gap' : 'covered'}"><span class="route-symbol" aria-hidden="true">${gap ? '○' : '✓'}</span><span><strong>${e(titleCase(ingredient.name))}</strong><small>${e(detail)}</small></span><span>${formatQuantity(ingredient.quantity, ingredient.unit)}</span></li>`;
  }).join('');
  content.innerHTML = `
    <div class="dialog-heading"><div><p class="map-code">MEAL DETAILS · ${result.score}% COVERED</p><h2 id="route-dialog-title">${e(meal.name)}</h2></div><button class="icon-button" id="close-route" type="button" aria-label="Close meal details"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17"/></svg></button></div>
    <p class="route-intro">${e(meal.note)}</p>
    <div class="route-score"><span style="--score:${result.score}" aria-hidden="true"></span><div><strong>${result.missing.length ? `${result.missing.length} item${result.missing.length === 1 ? '' : 's'} missing` : 'Ready from your pantry'}</strong><small>${result.substitutionCount ? `${result.substitutionCount} accepted substitution${result.substitutionCount === 1 ? '' : 's'} used` : 'Matched by ingredient name'}</small></div></div>
    <ul class="route-ingredients">${ingredientRows}</ul>
    <p class="responsibility-note">Check quantities, allergies, and whether swaps suit your version of this meal.</p>
    <div class="dialog-actions split"><div><button class="text-button" id="edit-current-meal" type="button">Edit meal</button><button class="text-button danger-text" id="delete-current-meal" type="button">Delete</button></div>${result.missing.length ? '<button class="button primary" id="add-gaps" type="button">Add gaps to list</button>' : '<button class="button primary" id="mark-route" type="button">Mark as chosen</button>'}</div>`;
  dialog.showModal();
  content.querySelector<HTMLButtonElement>('#close-route')?.addEventListener('click', () => dialog.close());
  content.querySelector<HTMLButtonElement>('#add-gaps')?.addEventListener('click', () => addGapsToShopping(meal, result.missing));
  content.querySelector<HTMLButtonElement>('#mark-route')?.addEventListener('click', () => recordRoute(meal, 0));
  content.querySelector<HTMLButtonElement>('#edit-current-meal')?.addEventListener('click', () => { dialog.close(); openMealEditor(meal); });
  content.querySelector<HTMLButtonElement>('#delete-current-meal')?.addEventListener('click', () => deleteMeal(meal));
}

function addGapsToShopping(meal: Meal, gaps: ReturnType<typeof matchMeal>['missing']): void {
  for (const gap of gaps) {
    const existing = state.shopping.find((item) => normalizeName(item.name) === normalizeName(gap.name) && item.unit === gap.unit && !item.checked);
    if (existing) {
      if (!existing.sourceMealIds.includes(meal.id)) {
        existing.quantity = Math.round((existing.quantity + gap.quantity) * 100) / 100;
        existing.sourceMealIds.push(meal.id);
      }
      existing.updatedAt = Date.now();
    } else {
      state.shopping.push({ id: id(), name: gap.name, quantity: gap.quantity, unit: gap.unit, checked: false, sourceMealIds: [meal.id], updatedAt: Date.now() });
    }
  }
  recordRoute(meal, gaps.length, false);
  document.querySelector<HTMLDialogElement>('#route-dialog')?.close();
  persist();
  renderApp();
  announce(`${gaps.length} missing item${gaps.length === 1 ? '' : 's'} added for ${meal.name}.`);
  location.hash = 'shopping';
}

function recordRoute(meal: Meal, gapCount: number, close = true): void {
  state.history.unshift({ id: id(), mealName: meal.name, gapCount, createdAt: Date.now() });
  state.history = state.history.slice(0, 12);
  persist();
  if (close) {
    document.querySelector<HTMLDialogElement>('#route-dialog')?.close();
    renderApp();
  announce(`${meal.name} added to recent choices.`);
  }
}

function ingredientRowMarkup(ingredient?: MealIngredient, rowNumber = 1): string {
  // A row is created dynamically, so every control needs its own stable DOM id.
  // The visible ordinal also distinguishes repeated field labels for assistive tech.
  const rowId = `ingredient-row-${id()}`;
  return `<div class="ingredient-row">
    <div class="field"><label for="${rowId}-name">Ingredient ${rowNumber}</label><input id="${rowId}-name" name="ingredient-name" required maxlength="60" value="${e(ingredient?.name ?? '')}" /></div>
    <div class="field"><label for="${rowId}-quantity">Amount ${rowNumber}</label><input id="${rowId}-quantity" name="ingredient-quantity" type="number" min="0.01" step="0.01" required value="${ingredient?.quantity ?? 1}" /></div>
    <div class="field"><label for="${rowId}-unit">Unit ${rowNumber}</label><select id="${rowId}-unit" name="ingredient-unit">${unitOptions(ingredient?.unit)}</select></div>
    <div class="field swaps-field"><label for="${rowId}-swaps">Accept instead ${rowNumber} <span>optional</span></label><input id="${rowId}-swaps" name="ingredient-swaps" maxlength="160" value="${e(ingredient?.substitutions.join(', ') ?? '')}" placeholder="e.g. lime, vinegar" /></div>
    <button class="icon-button quiet remove-ingredient" type="button" aria-label="Remove ingredient row"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17"/></svg></button>
  </div>`;
}

function openMealEditor(meal?: Meal): void {
  const dialog = document.querySelector<HTMLDialogElement>('#meal-dialog');
  const form = document.querySelector<HTMLFormElement>('#meal-form');
  const rows = document.querySelector<HTMLDivElement>('#ingredient-rows');
  if (!dialog || !form || !rows) return;
  editingMealId = meal?.id ?? null;
  (form.elements.namedItem('name') as HTMLInputElement).value = meal?.name ?? '';
  (form.elements.namedItem('note') as HTMLTextAreaElement).value = meal?.note ?? '';
  const title = document.querySelector<HTMLHeadingElement>('#meal-dialog-title');
  if (title) title.textContent = meal ? 'Edit your meal' : 'Add your meal';
  rows.innerHTML = (meal?.ingredients.length ? meal.ingredients : [undefined, undefined, undefined]).map((entry, index) => ingredientRowMarkup(entry, index + 1)).join('');
  bindIngredientRemoveButtons();
  dialog.showModal();
  window.setTimeout(() => (form.elements.namedItem('name') as HTMLInputElement).focus(), 0);
}

function addIngredientRow(): void {
  const rows = document.querySelector<HTMLDivElement>('#ingredient-rows');
  rows?.insertAdjacentHTML('beforeend', ingredientRowMarkup(undefined, rows.children.length + 1));
  bindIngredientRemoveButtons();
}

function bindIngredientRemoveButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('.remove-ingredient').forEach((button) => {
    button.onclick = () => {
      const rows = document.querySelectorAll('.ingredient-row');
      if (rows.length <= 1) {
        const message = document.querySelector<HTMLParagraphElement>('#meal-message');
        if (message) message.textContent = 'A meal needs at least one ingredient.';
        return;
      }
      button.closest('.ingredient-row')?.remove();
    };
  });
}

function saveMealFromForm(event: SubmitEvent): void {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  const names = data.getAll('ingredient-name').map((value) => normalizeName(String(value)));
  const quantities = data.getAll('ingredient-quantity').map(Number);
  const units = data.getAll('ingredient-unit') as Unit[];
  const swaps = data.getAll('ingredient-swaps').map((value) => String(value).split(',').map(normalizeName).filter(Boolean));
  const message = document.querySelector<HTMLParagraphElement>('#meal-message');
  if (!names.length || names.some((name) => !name) || quantities.some((quantity) => !Number.isFinite(quantity) || quantity <= 0)) {
    if (message) message.textContent = 'Every ingredient needs a name and an amount greater than zero.';
    return;
  }
  const now = Date.now();
  const existing = editingMealId ? state.meals.find((meal) => meal.id === editingMealId) : undefined;
  const mealId = existing?.id ?? id();
  const ingredients: MealIngredient[] = names.map((name, index) => ({ id: existing?.ingredients[index]?.id ?? id(), name, quantity: quantities[index] ?? 1, unit: units[index] ?? 'item', substitutions: swaps[index] ?? [] }));
  const next: Meal = { id: mealId, name: String(data.get('name') ?? '').trim(), note: String(data.get('note') ?? '').trim() || 'A meal you can make with your own ingredients.', tags: [], ingredients, starter: existing?.starter ?? false, updatedAt: now };
  if (!next.name) {
    if (message) message.textContent = 'Give this meal a name.';
    return;
  }
  if (existing) state.meals[state.meals.indexOf(existing)] = next;
  else state.meals.push(next);
  persist();
  document.querySelector<HTMLDialogElement>('#meal-dialog')?.close();
  renderApp();
  announce(`${next.name} ${existing ? 'updated' : 'added'}.`);
  location.hash = 'meals';
}

function deleteMeal(meal: Meal): void {
  if (!window.confirm(`Delete “${meal.name}”? You can restore starter meals later, but custom meals cannot be recovered without a backup.`)) return;
  state.meals = state.meals.filter((entry) => entry.id !== meal.id);
  document.querySelector<HTMLDialogElement>('#route-dialog')?.close();
  persist();
  renderApp();
  announce(`${meal.name} deleted.`);
}

function restoreStarters(): void {
  const missing = STARTER_MEALS.filter((starter) => !state.meals.some((meal) => meal.id === starter.id));
  state.meals.push(...structuredClone(missing));
  persist();
  renderApp();
  announce(`${missing.length} starter meal${missing.length === 1 ? '' : 's'} restored.`);
}

function removeShoppingItem(itemId: string): void {
  const item = state.shopping.find((entry) => entry.id === itemId);
  if (!item) return;
  state.shopping = state.shopping.filter((entry) => entry.id !== itemId);
  persist();
  renderApp();
  announce(`${titleCase(item.name)} removed from the list.`);
}

function clearChecked(): void {
  const count = state.shopping.filter((item) => item.checked).length;
  state.shopping = state.shopping.filter((item) => !item.checked);
  persist();
  renderApp();
  announce(`${count} checked item${count === 1 ? '' : 's'} removed.`);
}

function shoppingText(): string {
  return state.shopping.filter((item) => !item.checked).map((item) => `• ${titleCase(item.name)} — ${formatQuantity(item.quantity, item.unit)}`).join('\n');
}

async function copyShoppingList(): Promise<void> {
  try {
    await navigator.clipboard.writeText(shoppingText());
    announce('Shopping list copied.');
  } catch {
    announce('Copy was blocked. Use Export CSV instead.', true);
  }
}

function download(name: string, contents: string, type: string): void {
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(new Blob([contents], { type }));
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function exportShoppingCsv(): void {
  const rows = [['ingredient', 'quantity', 'unit', 'checked'], ...state.shopping.map((item) => [item.name, String(item.quantity), item.unit, String(item.checked)])];
  download('pantry-meal-gap-shopping.csv', rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv');
  announce('Shopping list exported.');
}

function exportBackup(): void {
  download(`pantry-meal-gap-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ product: 'pantry-meal-gap', version: 1, exportedAt: new Date().toISOString(), data: state }, null, 2), 'application/json');
  announce('Local backup exported.');
}

async function importBackup(event: Event): Promise<void> {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const imported = parseBackup(JSON.parse(await file.text()));
    if (!imported) throw new Error('invalid');
    if (!window.confirm('Replace this device’s pantry, meals, shopping list, and route history with the imported backup?')) return;
    const nextState: AppState = { ...imported, updatedAt: Date.now() };
    // Render before committing so a future display change cannot persist an
    // unusable backup. State is only swapped after both steps succeed.
    const previousState = state;
    state = nextState;
    try {
      renderApp();
      await saveState(nextState, storageScope);
    } catch (error) {
      state = previousState;
      renderApp();
      throw error;
    }
    announce('Backup imported.');
  } catch {
    announce('That file is not a valid Pantry Meal Gap backup.', true);
  } finally {
    input.value = '';
  }
}

async function resetDemo(): Promise<void> {
  if (!isDemo) return;
  state = freshDemoState();
  try {
    await saveState(state, 'demo');
    renderApp();
    announce('Sample data reset.');
  } catch {
    renderApp();
    announce('Could not reset the sample. Reload the demo.', true);
  }
}

async function startForReal(): Promise<void> {
  if (!isDemo) return;
  try { sessionStorage.removeItem(DEMO_ROUTE_MARKER); } catch { /* The isolated database remains separate. */ }
  try {
    await clearState('demo');
  } catch {
    // Navigation still leaves the isolated namespace behind rather than mixing it with real data.
  }
  location.assign('/');
}

function toggleTheme(): void {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('pantry-meal-gap-theme', next); } catch { /* Theme persistence is optional. */ }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#111814' : '#f3eedf');
  announce(`${titleCase(next)} theme enabled.`);
}

function applySavedTheme(): void {
  let saved: string | null = null;
  try { saved = localStorage.getItem('pantry-meal-gap-theme'); } catch { /* Use the system theme when storage is blocked. */ }
  const theme = saved === 'light' || saved === 'dark' ? saved : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#111814' : '#f3eedf');
}

async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    if (registration.waiting) {
      undoAction = () => registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      announce('An update is ready.', false, 'Update');
    }
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'UPDATE_AVAILABLE') {
        undoAction = () => location.reload();
        announce('The offline app was updated.', false, 'Reload');
      }
    });
  } catch {
    announce('Offline installation is unavailable, but the app still works online.', true);
  }
}

async function start(): Promise<void> {
  applySavedTheme();
  if (renderLegalPage()) {
    bindEvents();
    await registerServiceWorker();
    return;
  }
  try {
    const stored = await loadState(storageScope);
    const recovered = stored ? normalizeAppState(stored) : null;
    if (stored && !recovered) {
      state = isDemo ? freshDemoState() : freshState();
      await saveState(state, storageScope);
      window.setTimeout(() => announce(isDemo ? 'Damaged sample data was reset.' : 'Damaged local data was reset to a safe starter pantry.', true), 100);
    } else {
      state = recovered ?? (isDemo ? freshDemoState() : freshState());
      if (!state.seeded) state = isDemo ? freshDemoState() : freshState();
    }
  } catch {
    state = freshState();
    window.setTimeout(() => announce('Browser storage is unavailable. Export a backup before closing.', true), 100);
  }
  renderApp();
  addEventListener('online', updateOnlineState);
  addEventListener('offline', updateOnlineState);
  await registerServiceWorker();
}

document.addEventListener('click', delegatedClick);
document.addEventListener('change', delegatedChange);
void start();
