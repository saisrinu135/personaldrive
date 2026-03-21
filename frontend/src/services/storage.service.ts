const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const setAccessToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
};

export const setRefreshToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
};

const isValidToken = (value: string | null): string | null => {
  if (!value || value === 'null' || value === 'undefined') return null;
  return value;
};

export const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return isValidToken(localStorage.getItem(ACCESS_TOKEN_KEY));
  }
  return null;
};

export const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return isValidToken(localStorage.getItem(REFRESH_TOKEN_KEY));
  }
  return null;
};

export const clearTokens = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

/**
 * Decode the JWT expiry claim and return true if the token is expired
 * or will expire within the next `bufferSeconds` seconds.
 * No external library needed — just base64-decode the payload section.
 */
export const isTokenExpired = (token: string | null, bufferSeconds = 30): boolean => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false; // no expiry claim = treat as valid
    const nowSeconds = Math.floor(Date.now() / 1000);
    return payload.exp < nowSeconds + bufferSeconds;
  } catch {
    return true; // malformed token = treat as expired
  }
};
