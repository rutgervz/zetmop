function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const SESSION_KEY = 'zetmop_session_player_id';

let cachedId: string | null = null;

/**
 * Returns a player ID unique per browser tab (sessionStorage).
 * This ensures two tabs on the same device get different IDs.
 * Within the same tab, the ID persists across page reloads (for reconnection).
 */
export async function getPlayerId(): Promise<string> {
  if (cachedId) return cachedId;

  // Use sessionStorage on web (unique per tab), fallback to random
  if (typeof sessionStorage !== 'undefined') {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      cachedId = stored;
      return stored;
    }
    const id = uuid();
    cachedId = id;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  }

  // Native: just generate a random ID per session
  const id = uuid();
  cachedId = id;
  return id;
}
