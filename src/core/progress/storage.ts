import type { ProgressStore } from './types';

export const PROGRESS_STORAGE_KEY = 'loom:progress:v1';

export function loadProgress(): ProgressStore {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ProgressStore;
  } catch {
    return {};
  }
}

export function saveProgress(store: ProgressStore): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // silently fail if localStorage is unavailable
  }
}
