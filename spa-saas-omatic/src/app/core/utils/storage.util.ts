/**
 * Safe browser storage access utilities.
 * Encapsulates localStorage access to gracefully handle restricted environments
 * (such as incognito/private mode, sandboxed iframes, disabled third-party storage,
 * and quota limits) without scattering empty try/catch blocks across services.
 */

export function getSafeStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {
    // Graceful degradation when browser privacy restrictions or sandbox blocks storage
  }
  return null;
}

export function setSafeStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    // Graceful degradation when storage quota is exceeded or storage is disabled
  }
}
