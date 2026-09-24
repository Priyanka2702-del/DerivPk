// Lightweight client-side session flag for gating the User Panel in the
// absence of a real backend/auth provider. This is intentionally simple:
// swap the three functions below for real session/cookie/JWT checks once
// an authentication backend is connected — nothing else in the dashboard
// needs to change, since pages only ever call these three functions.

const SESSION_KEY = "pk_session";

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return true; // avoid SSR/client mismatch flicker
  const value = window.localStorage.getItem(SESSION_KEY);
  // No explicit flag yet (fresh browser) is treated as logged in so the
  // dashboard demo remains browsable; an explicit "false" (set on logout)
  // is what actually locks the panel.
  return value !== "false";
}

export function login() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, "true");
}

export function logout() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, "false");
}
