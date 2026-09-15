import { useCallback, useSyncExternalStore } from 'react';
import { sha256 } from './format';
import { getDB } from './store';

const KEY = 'ivan-admin-session';
const listeners = new Set<() => void>();
let session: { user: string; at: number } | null = read();

function read() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as { user: string; at: number }) : null;
  } catch {
    return null;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function useSession() {
  const sel = useCallback(() => session, []);
  return useSyncExternalStore((cb) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }, sel, sel);
}

export const auth = {
  async login(user: string, pass: string) {
    const s = getDB().settings;
    const hash = await sha256(pass);
    if (user.trim().toLowerCase() !== s.adminUser.toLowerCase() || hash !== s.adminPassHash) {
      return { ok: false as const, error: 'Incorrect username or password.' };
    }
    session = { user: s.adminUser, at: Date.now() };
    sessionStorage.setItem(KEY, JSON.stringify(session));
    emit();
    return { ok: true as const };
  },
  logout() {
    session = null;
    sessionStorage.removeItem(KEY);
    emit();
  },
  current: () => session,
};
