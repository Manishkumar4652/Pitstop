import { ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import { NextResponse } from 'next/server';

export const AUTH_COOKIE_NAME = 'pitstop_token';
export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Standard cookie configuration for the session JWT.
 * Enforces HttpOnly, SameSite=Lax, and Secure in production.
 */
export function getAuthCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE,
  };
}

/**
 * Attaches the authenticated JWT token to the response as a secure HttpOnly cookie.
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
}

/**
 * Clears the session cookie from the response.
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    ...getAuthCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
}
