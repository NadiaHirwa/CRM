/**
 * Auth utility functions for managing JWT tokens in localStorage
 * Handles token persistence, expiry checking, and session restoration
 */

export interface AuthData {
  token: string;
  role: string;
  userName: string;
  expiresAt: number; // timestamp in milliseconds
}

const STORAGE_KEY = 'flr_crm_auth';

/**
 * Decode JWT token to get expiry time
 * JWT tokens have 3 parts: header.payload.signature
 * Payload contains 'exp' (expiry timestamp in seconds)
 */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp) {
      return payload.exp * 1000; // Convert to milliseconds
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired or will expire soon (within 5 minutes)
 */
function isTokenExpired(expiresAt: number, bufferMinutes: number = 5): boolean {
  const bufferMs = bufferMinutes * 60 * 1000;
  return Date.now() >= (expiresAt - bufferMs);
}

/**
 * Save auth data to localStorage
 */
export function saveAuthData(token: string, role: string, userName: string): void {
  const expiresAt = getTokenExpiry(token);
  if (!expiresAt) {
    console.warn('Could not parse token expiry, using default 8 hours');
  }
  
  const authData: AuthData = {
    token,
    role,
    userName,
    expiresAt: expiresAt || Date.now() + 8 * 60 * 60 * 1000, // Default 8 hours
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
}

/**
 * Load auth data from localStorage
 * Returns null if no data exists or token is expired
 */
export function loadAuthData(): AuthData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const authData: AuthData = JSON.parse(stored);
    
    // Check if token is expired
    if (isTokenExpired(authData.expiresAt)) {
      clearAuthData();
      return null;
    }
    
    return authData;
  } catch (error) {
    console.error('Error loading auth data:', error);
    clearAuthData();
    return null;
  }
}

/**
 * Clear auth data from localStorage
 */
export function clearAuthData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if current token is valid (not expired)
 */
export function isTokenValid(): boolean {
  const authData = loadAuthData();
  return authData !== null;
}

/**
 * Get remaining time until token expiry in minutes
 */
export function getTokenTimeRemaining(): number | null {
  const authData = loadAuthData();
  if (!authData) return null;
  
  const remaining = authData.expiresAt - Date.now();
  return Math.max(0, Math.floor(remaining / 60000)); // Convert to minutes
}
