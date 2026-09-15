import { useCallback, useSyncExternalStore } from 'react';
import type {
  CafeTable,
  CallReason,
  CartLine,
  Category,
  DB,
  MenuItem,
  Order,
  OrderStatus,
  Settings,
  StaffCall,
} from './types';
import { seedDB } from './seed';
import { orderCode, uid } from './format';

const KEY = 'ivan-food-court-db-v7';
const CHANNEL = 'ivan-food-court-sync';

let db: DB = load();
const listeners = new Set<() => void>();
let bc: BroadcastChannel | null = null;

/**
 * Derived snapshot — rebuilt only when the database actually changes so that
 * `useSyncExternalStore` always receives stable references (no render loops).
 */
export interface Snapshot {
  db: DB;
  settings: Settings;
  categories: Category[];
  items: MenuItem[];
  tables: CafeTable[];
  orders: Order[];
  calls: StaffCall[];
}

function build(d: DB): Snapshot {
  return {
    db: d,
    settings: d.settings,
    categories: [...d.categories].sort((a, b) => a.sort - b.sort),
    items: d.items,
    tables: d.tables,
    orders: [...d.orders].sort((a, b) => b.createdAt - a.createdAt),
    calls: [...d.calls].sort((a, b) => b.createdAt - a.createdAt),
  };
}

let snap: Snapshot = build(db);

function load(): DB {
  if (typeof window === 'undefined') return seedDB();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const fresh = seedDB();
      localStorage.setItem(KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw) as DB;
    if (!parsed || parsed.version !== 7 || !Array.isArray(parsed.items)) {
      const fresh = seedDB();
      localStorage.setItem(KEY, JSON.stringify(fresh));
      return fresh;
    }
    return parsed;
  } catch {
    return seedDB();
  }
}

function emit() {
  snap = build(db);
  listeners.forEach((l) => l());
}

function persist(broadcast = true) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage full / private mode — state still lives in memory */
  }
  if (broadcast) {
    try {
      bc?.postMessage({ type: 'db', at: Date.now() });
    } catch {
      /* noop */
    }
  }
  emit();
}

if (typeof window !== 'undefined') {
  try {
    bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = () => {
      db = load();
      emit();
    };
  } catch {
    bc = null;
  }
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      db = load();
      emit();
    }
  });
}

function mutate(fn: (draft: DB) => void) {
  const draft: DB = JSON.parse(JSON.stringify(db));
  fn(draft);
  db = draft;
  persist();
}

export function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export const getDB = () => db;

export function useDB<T>(selector: (s: Snapshot) => T): T {
  const sel = useCallback(() => selector(snap), [selector]);
  return useSyncExternalStore(subscribe, sel, sel);
}

/* ---------------------------------- reads --------------------------------- */

const selSettings = (s: Snapshot) => s.settings;
const selCategories = (s: Snapshot) => s.categories;
const selItems = (s: Snapshot) => s.items;
const selTables = (s: Snapshot) => s.tables;
const selOrders = (s: Snapshot) => s.orders;
const selCalls = (s: Snapshot) => s.calls;

export const useSettings = () => useDB(selSettings);
export const useCategories = () => useDB(selCategories);
export const useItems = () => useDB(selItems);
export const useTables = () => useDB(selTables);
export const useOrders = () => useDB(selOrders);
export const useCalls = () => useDB(selCalls);

export function useOrder(id?: string) {
  const sel = useCallback((s: Snapshot) => s.orders.find((o) => o.id === id || o.code === id), [id]);
  return useDB(sel);
}

/* --------------------------------- pricing -------------------------------- */

export function priceOrder(lines: CartLine[], s: Settings) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const taxAmount = (subtotal * s.taxPercent) / 100;
  const serviceAmount = s.serviceEnabled ? (subtotal * s.servicePercent) / 100 : 0;
  return {
    subtotal,
    taxAmount: Math.round(taxAmount * 100) / 100,
    serviceAmount: Math.round(serviceAmount * 100) / 100,
    total: Math.round((subtotal + taxAmount + serviceAmount) * 100) / 100,
  };
}

/* --------------------------------- actions -------------------------------- */

export const actions = {
  placeOrder(input: {
    tableCode: string;
    lines: CartLine[];
    customerName: string;
    customerPhone?: string;
    note?: string;
    paymentMode: Order['paymentMode'];
  }): Order {
    const s = db.settings;
    const totals = priceOrder(input.lines, s);
    const now = Date.now();
    const order: Order = {
      id: uid('o_'),
      code: orderCode(),
      tableCode: input.tableCode,
      customerName: input.customerName.trim() || 'Guest',
      customerPhone: input.customerPhone,
      lines: input.lines,
      note: input.note,
      ...totals,
      taxPercent: s.taxPercent,
      servicePercent: s.serviceEnabled ? s.servicePercent : 0,
      status: 'CONFIRMED',
      createdAt: now,
      updatedAt: now,
      timeline: [
        { status: 'RECEIVED', at: now, by: 'Guest' },
        { status: 'CONFIRMED', at: now, by: 'Instant Confirmation' },
      ],
      paymentMode: input.paymentMode,
    };
    mutate((d) => {
      d.orders.push(order);
    });
    return order;
  },

  setOrderStatus(id: string, status: OrderStatus, by = 'Staff') {
    mutate((d) => {
      const o = d.orders.find((x) => x.id === id);
      if (!o) return;
      o.status = status;
      o.updatedAt = Date.now();
      o.timeline.push({ status, at: Date.now(), by });
    });
  },

  callStaff(tableCode: string, reason: CallReason, note?: string) {
    const call = { id: uid('c_'), tableCode, reason, note, createdAt: Date.now(), resolved: false };
    mutate((d) => {
      d.calls.push(call);
    });
    return call;
  },

  resolveCall(id: string) {
    mutate((d) => {
      const c = d.calls.find((x) => x.id === id);
      if (c) c.resolved = true;
    });
  },

  saveItem(item: MenuItem) {
    mutate((d) => {
      const i = d.items.findIndex((x) => x.id === item.id);
      if (i >= 0) d.items[i] = item;
      else d.items.unshift(item);
    });
  },

  deleteItem(id: string) {
    mutate((d) => {
      d.items = d.items.filter((x) => x.id !== id);
    });
  },

  toggleSoldOut(id: string) {
    mutate((d) => {
      const it = d.items.find((x) => x.id === id);
      if (it) it.soldOut = !it.soldOut;
    });
  },

  saveCategory(cat: Category) {
    mutate((d) => {
      const i = d.categories.findIndex((c) => c.id === cat.id);
      if (i >= 0) d.categories[i] = cat;
      else d.categories.push(cat);
    });
  },

  deleteCategory(id: string) {
    mutate((d) => {
      d.categories = d.categories.filter((c) => c.id !== id);
      d.items = d.items.filter((i) => i.categoryId !== id);
    });
  },

  saveTable(table: CafeTable) {
    mutate((d) => {
      const i = d.tables.findIndex((t) => t.id === table.id);
      if (i >= 0) d.tables[i] = table;
      else d.tables.push(table);
    });
  },

  deleteTable(id: string) {
    mutate((d) => {
      d.tables = d.tables.filter((t) => t.id !== id);
    });
  },

  saveSettings(patch: Partial<Settings>) {
    mutate((d) => {
      d.settings = { ...d.settings, ...patch };
    });
  },

  clearOrders() {
    mutate((d) => {
      d.orders = [];
      d.calls = [];
    });
  },

  resetAll() {
    db = seedDB();
    persist();
  },

  seedDemoOrders() {
    const s = db.settings;
    const pick = (n: number) => db.items[n % db.items.length];
    const mk = (tableCode: string, idxs: number[], status: OrderStatus, minsAgo: number): Order => {
      const lines: CartLine[] = idxs.map((n) => {
        const it = pick(n);
        return {
          lineId: uid('l_'),
          itemId: it.id,
          name: it.name,
          image: it.image,
          basePrice: it.price,
          unitPrice: it.price,
          qty: 1 + (n % 2),
          addons: [],
        };
      });
      const totals = priceOrder(lines, s);
      const at = Date.now() - minsAgo * 60000;
      return {
        id: uid('o_'),
        code: orderCode(),
        tableCode,
        customerName: ['Aisha', 'Rahul', 'Meera', 'Dan'][idxs[0] % 4],
        lines,
        ...totals,
        taxPercent: s.taxPercent,
        servicePercent: s.serviceEnabled ? s.servicePercent : 0,
        status,
        createdAt: at,
        updatedAt: at,
        timeline: [{ status: 'RECEIVED', at, by: 'Guest' }],
        paymentMode: 'COUNTER',
      };
    };
    mutate((d) => {
      d.orders.push(
        mk('T03', [1, 10, 20], 'RECEIVED', 3),
        mk('T05', [14, 18], 'PREPARING', 11),
        mk('T02', [4, 21], 'READY', 17),
        mk('T07', [6, 12], 'SERVED', 64),
        mk('T01', [2, 9, 15], 'SERVED', 140),
      );
    });
  },
};
