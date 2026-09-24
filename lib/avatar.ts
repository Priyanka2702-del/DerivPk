const AVATAR_KEY = "pk_user_avatar";
const AVATAR_EVENT = "pk-avatar-changed";

export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

/** Returns the user's uploaded avatar (data URL) or null if none was set. */
export function getAvatar(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AVATAR_KEY);
}

/** Saves the uploaded avatar and notifies other components in this tab. */
export function setAvatar(dataUrl: string) {
  window.localStorage.setItem(AVATAR_KEY, dataUrl);
  window.dispatchEvent(new Event(AVATAR_EVENT));
}

/** Removes the uploaded avatar, reverting to the default PK mark. */
export function clearAvatar() {
  window.localStorage.removeItem(AVATAR_KEY);
  window.dispatchEvent(new Event(AVATAR_EVENT));
}

/** Subscribes to avatar changes (same-tab custom event + cross-tab storage event). */
export function subscribeToAvatar(callback: () => void) {
  window.addEventListener(AVATAR_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(AVATAR_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}