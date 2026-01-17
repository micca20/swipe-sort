// Local storage helpers for persistent state

import type { MaintainerrConfig, FilterOptions, SwipeAction } from '@/types/maintainerr';

type AppStep = 'setup' | 'library' | 'collection' | 'swipe';

const STORAGE_KEYS = {
  CONFIG: 'maintainarr_config',
  CURRENT_INDEX: 'maintainarr_current_index',
  SELECTED_COLLECTION: 'maintainarr_selected_collection',
  FILTERS: 'maintainarr_filters',
  SWIPE_HISTORY: 'maintainarr_swipe_history',
  APP_STEP: 'maintainarr_app_step',
  SELECTED_LIBRARY: 'maintainarr_selected_library',
} as const;

// Config
export function saveConfig(config: MaintainerrConfig): void {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
}

export function getConfig(): MaintainerrConfig | null {
  const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
  return stored ? JSON.parse(stored) : null;
}

export function clearConfig(): void {
  localStorage.removeItem(STORAGE_KEYS.CONFIG);
}

// Current index (progress)
export function saveCurrentIndex(index: number): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_INDEX, String(index));
}

export function getCurrentIndex(): number {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_INDEX);
  return stored ? parseInt(stored, 10) : 0;
}

export function resetProgress(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_INDEX);
  localStorage.removeItem(STORAGE_KEYS.SWIPE_HISTORY);
}

// Selected collection
export function saveSelectedCollection(collectionId: number | null): void {
  if (collectionId === null) {
    localStorage.removeItem(STORAGE_KEYS.SELECTED_COLLECTION);
  } else {
    localStorage.setItem(STORAGE_KEYS.SELECTED_COLLECTION, String(collectionId));
  }
}

export function getSelectedCollection(): number | null {
  const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_COLLECTION);
  return stored ? parseInt(stored, 10) : null;
}

// Filters
export function saveFilters(filters: FilterOptions): void {
  localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(filters));
}

export function getFilters(): FilterOptions {
  const stored = localStorage.getItem(STORAGE_KEYS.FILTERS);
  return stored ? JSON.parse(stored) : { mediaType: 'all', sortBy: 'oldest' };
}

// Swipe history (for potential undo feature)
export function saveSwipeHistory(history: SwipeAction[]): void {
  localStorage.setItem(STORAGE_KEYS.SWIPE_HISTORY, JSON.stringify(history));
}

export function getSwipeHistory(): SwipeAction[] {
  const stored = localStorage.getItem(STORAGE_KEYS.SWIPE_HISTORY);
  return stored ? JSON.parse(stored) : [];
}

export function addToSwipeHistory(action: SwipeAction): void {
  const history = getSwipeHistory();
  history.push(action);
  // Keep only last 50 actions
  if (history.length > 50) {
    history.shift();
  }
  saveSwipeHistory(history);
}

// App step
export function saveAppStep(step: AppStep): void {
  localStorage.setItem(STORAGE_KEYS.APP_STEP, step);
}

export function getAppStep(): AppStep {
  const stored = localStorage.getItem(STORAGE_KEYS.APP_STEP);
  return (stored as AppStep) || 'setup';
}

// Selected library
export function saveSelectedLibrary(libraryId: string | null): void {
  if (libraryId === null) {
    localStorage.removeItem(STORAGE_KEYS.SELECTED_LIBRARY);
  } else {
    localStorage.setItem(STORAGE_KEYS.SELECTED_LIBRARY, libraryId);
  }
}

export function getSelectedLibrary(): string | null {
  return localStorage.getItem(STORAGE_KEYS.SELECTED_LIBRARY);
}

// Clear all app data
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}
