import { useCallback, useSyncExternalStore } from 'react';
import type { CartLine } from './types';

const KEY = 'ivan-cart-v3';

type CartState = Record<string, CartLine[]>;

let state: CartState = read();
const listeners = new Set<() => void>();

function read(): CartState {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function commit(next: CartState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = read();
      listeners.forEach((l) => l());
    }
  });
}

export function useCart(table: string) {
  const sel = useCallback(() => state[table] ?? EMPTY, [table]);
  return useSyncExternalStore(subscribe, sel, sel);
}

const EMPTY: CartLine[] = [];

export const cart = {
  get(table: string) {
    return state[table] ?? [];
  },
  add(table: string, line: CartLine) {
    const lines = [...(state[table] ?? [])];
    const signature = (l: CartLine) =>
      l.itemId + '|' + l.addons.map((a) => a.optionName).join(',') + '|' + (l.note ?? '');
    const existing = lines.findIndex((l) => signature(l) === signature(line));
    if (existing >= 0) lines[existing] = { ...lines[existing], qty: lines[existing].qty + line.qty };
    else lines.push(line);
    commit({ ...state, [table]: lines });
  },
  setQty(table: string, lineId: string, qty: number) {
    const lines = (state[table] ?? [])
      .map((l) => (l.lineId === lineId ? { ...l, qty } : l))
      .filter((l) => l.qty > 0);
    commit({ ...state, [table]: lines });
  },
  remove(table: string, lineId: string) {
    commit({ ...state, [table]: (state[table] ?? []).filter((l) => l.lineId !== lineId) });
  },
  setNote(table: string, lineId: string, note: string) {
    commit({
      ...state,
      [table]: (state[table] ?? []).map((l) => (l.lineId === lineId ? { ...l, note } : l)),
    });
  },
  clear(table: string) {
    const next = { ...state };
    delete next[table];
    commit(next);
  },
};
