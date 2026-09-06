import type { AppState } from './types';

export type StorageScope = 'real' | 'demo';

const DB_NAMES: Record<StorageScope, string> = {
  real: 'pantry-meal-gap',
  demo: 'demo:pantry-meal-gap'
};
const STORE_NAME = 'state';
const STATE_KEY = 'current';

function openDatabase(scope: StorageScope): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAMES[scope], 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local storage.'));
  });
}

export async function loadState(scope: StorageScope = 'real'): Promise<AppState | null> {
  const database = await openDatabase(scope);
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(STATE_KEY);
    request.onsuccess = () => resolve((request.result as AppState | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error('Could not read local data.'));
    transaction.oncomplete = () => database.close();
  });
}

export async function saveState(state: AppState, scope: StorageScope = 'real'): Promise<void> {
  const database = await openDatabase(scope);
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(state, STATE_KEY);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save local data.'));
  });
}

/** Delete only the requested namespace. Demo teardown can never touch real data. */
export function clearState(scope: StorageScope): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAMES[scope]);
    request.onsuccess = () => resolve();
    request.onblocked = () => reject(new Error('Could not clear local storage.'));
    request.onerror = () => reject(request.error ?? new Error('Could not clear local storage.'));
  });
}
