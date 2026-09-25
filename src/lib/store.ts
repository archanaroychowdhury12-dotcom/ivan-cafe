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
import { defaultPromoOffer, seedDB } from './seed';
import { orderCode, uid } from './format';
import {
  isSupabaseConfigured,
  mapCallFromDb,
  mapCallToDb,
  mapCategoryFromDb,
  mapCategoryToDb,
  mapItemFromDb,
  mapItemToDb,
  mapOrderFromDb,
  mapOrderToDb,
  mapSettingsFromDb,
  mapSettingsToDb,
  mapTableFromDb,
  mapTableToDb,
  cancelOrderServer,
  supabase,
} from './supabase';
import { playStaffCallAlert } from './sound';

const CURRENT_VERSION = 10;
const KEY = 'ivan-food-court-db-v10';
const CHANNEL = 'ivan-food-court-sync';

let db: DB = load();
const listeners = new Set<() => void>();
let bc: BroadcastChannel | null = null;

export interface SyncStatus {
  isConfigured: boolean;
  connected: boolean;
  syncing: boolean;
  lastSyncAt: number | null;
  error: string | null;
}

let syncStatus: SyncStatus = {
  isConfigured: isSupabaseConfigured,
  connected: false,
  syncing: false,
  lastSyncAt: null,
  error: null,
};

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
  syncStatus: SyncStatus;
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
    syncStatus: { ...syncStatus },
  };
}

let snap: Snapshot = build(db);

function load(): DB {
  if (typeof window === 'undefined') return seedDB();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const fresh = seedDB();
      fresh.version = CURRENT_VERSION;
      localStorage.setItem(KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw) as DB;
    if (!parsed || typeof parsed !== 'object') {
      const fresh = seedDB();
      fresh.version = CURRENT_VERSION;
      localStorage.setItem(KEY, JSON.stringify(fresh));
      return fresh;
    }

    // Always preserve any existing orders and calls
    const existingOrders = Array.isArray(parsed.orders) ? parsed.orders : [];
    const existingCalls = Array.isArray(parsed.calls) ? parsed.calls : [];

    if (parsed.version !== CURRENT_VERSION || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      const fresh = seedDB();
      fresh.version = CURRENT_VERSION;
      fresh.orders = existingOrders;
      fresh.calls = existingCalls;
      if (parsed.settings) {
        fresh.settings = { ...fresh.settings, ...parsed.settings };
      }
      if (!fresh.settings.offer) {
        try {
          const storedOffer = typeof localStorage !== 'undefined' ? localStorage.getItem('ivan_cafe_offer') : null;
          fresh.settings.offer = storedOffer ? JSON.parse(storedOffer) : defaultPromoOffer;
        } catch {
          fresh.settings.offer = defaultPromoOffer;
        }
      }
      localStorage.setItem(KEY, JSON.stringify(fresh));
      return fresh;
    }

    parsed.orders = existingOrders;
    parsed.calls = existingCalls;
    parsed.version = CURRENT_VERSION;
    if (!parsed.settings) {
      parsed.settings = seedDB().settings;
    }
    if (!parsed.settings.offer) {
      try {
        const storedOffer = typeof localStorage !== 'undefined' ? localStorage.getItem('ivan_cafe_offer') : null;
        parsed.settings.offer = storedOffer ? JSON.parse(storedOffer) : defaultPromoOffer;
      } catch {
        parsed.settings.offer = defaultPromoOffer;
      }
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

function updateSyncStatus(patch: Partial<SyncStatus>) {
  syncStatus = { ...syncStatus, ...patch };
  emit();
}

function mutate(fn: (draft: DB) => void) {
  const draft: DB = JSON.parse(JSON.stringify(db));
  fn(draft);
  db = draft;
  persist();
}

/* --------------------------------- Supabase Sync --------------------------------- */

async function seedSupabaseIfEmpty() {
  if (!supabase) return;
  try {
    const { data: catCheck, error: catErr } = await supabase.from('categories').select('id').limit(1);
    if (catErr) {
      console.warn('Supabase categories check error:', catErr);
      return;
    }

    if (!catCheck || catCheck.length === 0) {
      console.log('Supabase is empty. Seeding initial categories, items, tables, and settings...');
      // Seed categories
      await supabase.from('categories').upsert(db.categories.map(mapCategoryToDb));
      // Seed items
      await supabase.from('menu_items').upsert(db.items.map(mapItemToDb));
      // Seed tables
      await supabase.from('cafe_tables').upsert(db.tables.map(mapTableToDb));
      // Seed settings
      await supabase.from('settings').upsert(mapSettingsToDb(db.settings));
    }
  } catch (err: any) {
    console.error('Failed to auto-seed Supabase:', err);
  }
}

async function fetchFromSupabase() {
  if (!supabase) return;
  updateSyncStatus({ syncing: true, error: null });

  try {
    // 1. Categories
    const { data: categoriesData, error: catError } = await supabase.from('categories').select('*');
    if (catError) throw catError;

    // 2. Menu Items
    const { data: itemsData, error: itemsError } = await supabase.from('menu_items').select('*');
    if (itemsError) throw itemsError;

    // 3. Tables
    const { data: tablesData, error: tablesError } = await supabase.from('cafe_tables').select('*');
    if (tablesError) throw tablesError;

    // 4. Orders
    const { data: ordersData, error: ordersError } = await supabase.from('orders').select('*');
    if (ordersError) throw ordersError;

    // 5. Staff Calls
    const { data: callsData, error: callsError } = await supabase.from('staff_calls').select('*');
    if (callsError) throw callsError;

    // 6. Settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();
    if (settingsError) throw settingsError;

    // If categories and items are empty, trigger auto seed
    if ((!categoriesData || categoriesData.length === 0) && (!itemsData || itemsData.length === 0)) {
      await seedSupabaseIfEmpty();
      return;
    }

    const remoteCategories = categoriesData ? categoriesData.map(mapCategoryFromDb) : db.categories;
    const remoteItems = itemsData ? itemsData.map(mapItemFromDb) : db.items;
    const remoteTables = tablesData ? tablesData.map(mapTableFromDb) : db.tables;
    const remoteSettings = settingsData ? mapSettingsFromDb(settingsData, db.settings) : db.settings;

    // Merge orders: keep all remote orders, plus any local orders not yet in remote
    const orderMap = new Map<string, Order>();
    if (ordersData) {
      ordersData.map(mapOrderFromDb).forEach((o) => orderMap.set(o.id, o));
    }
    db.orders.forEach((o) => {
      if (!orderMap.has(o.id)) {
        orderMap.set(o.id, o);
      }
    });
    const mergedOrders = Array.from(orderMap.values()).sort((a, b) => b.createdAt - a.createdAt);

    // Merge staff calls
    const callMap = new Map<string, StaffCall>();
    if (callsData) {
      callsData.map(mapCallFromDb).forEach((c) => callMap.set(c.id, c));
    }
    db.calls.forEach((c) => {
      if (!callMap.has(c.id)) {
        callMap.set(c.id, c);
      }
    });
    const mergedCalls = Array.from(callMap.values()).sort((a, b) => b.createdAt - a.createdAt);

    db = {
      version: CURRENT_VERSION,
      categories: remoteCategories,
      items: remoteItems,
      tables: remoteTables,
      orders: mergedOrders,
      calls: mergedCalls,
      settings: remoteSettings,
    };

    persist(false);
    updateSyncStatus({
      connected: true,
      syncing: false,
      lastSyncAt: Date.now(),
      error: null,
    });
  } catch (err: any) {
    console.warn('Supabase sync warning:', err.message || err);
    updateSyncStatus({
      connected: false,
      syncing: false,
      error: err.message || 'Could not connect to Supabase database.',
    });
  }
}

function initSupabaseRealtime() {
  if (!supabase) return;

  // Initial fetch
  fetchFromSupabase();

  // Subscribe to table changes
  const channel = supabase
    .channel('food-court-db-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const newOrder = mapOrderFromDb(payload.new);
          mutate((d) => {
            if (!d.orders.some((o) => o.id === newOrder.id)) {
              d.orders.unshift(newOrder);
            }
          });
        } else if (payload.eventType === 'UPDATE') {
          const updated = mapOrderFromDb(payload.new);
          mutate((d) => {
            const idx = d.orders.findIndex((o) => o.id === updated.id);
            if (idx >= 0) d.orders[idx] = updated;
            else d.orders.unshift(updated);
          });
        } else if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          if (oldId) {
            mutate((d) => {
              d.orders = d.orders.filter((o) => o.id !== oldId);
            });
          }
        }
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'staff_calls' },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const newCall = mapCallFromDb(payload.new);
          mutate((d) => {
            if (!d.calls.some((c) => c.id === newCall.id)) {
              d.calls.unshift(newCall);
            }
          });
        } else if (payload.eventType === 'UPDATE') {
          const updated = mapCallFromDb(payload.new);
          mutate((d) => {
            const idx = d.calls.findIndex((c) => c.id === updated.id);
            if (idx >= 0) d.calls[idx] = updated;
            else d.calls.unshift(updated);
          });
        } else if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          if (oldId) {
            mutate((d) => {
              d.calls = d.calls.filter((c) => c.id !== oldId);
            });
          }
        }
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'menu_items' },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const item = mapItemFromDb(payload.new);
          mutate((d) => {
            const idx = d.items.findIndex((i) => i.id === item.id);
            if (idx >= 0) d.items[idx] = item;
            else d.items.push(item);
          });
        } else if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          if (oldId) {
            mutate((d) => {
              d.items = d.items.filter((i) => i.id !== oldId);
            });
          }
        }
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'categories' },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const cat = mapCategoryFromDb(payload.new);
          mutate((d) => {
            const idx = d.categories.findIndex((c) => c.id === cat.id);
            if (idx >= 0) d.categories[idx] = cat;
            else d.categories.push(cat);
          });
        } else if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          if (oldId) {
            mutate((d) => {
              d.categories = d.categories.filter((c) => c.id !== oldId);
            });
          }
        }
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'cafe_tables' },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const table = mapTableFromDb(payload.new);
          mutate((d) => {
            const idx = d.tables.findIndex((t) => t.id === table.id);
            if (idx >= 0) d.tables[idx] = table;
            else d.tables.push(table);
          });
        } else if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          if (oldId) {
            mutate((d) => {
              d.tables = d.tables.filter((t) => t.id !== oldId);
            });
          }
        }
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'settings' },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const s = mapSettingsFromDb(payload.new, db.settings);
          mutate((d) => {
            d.settings = s;
          });
        }
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        updateSyncStatus({ connected: true });
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        updateSyncStatus({ connected: false });
      }
    });

  return () => {
    supabase?.removeChannel(channel);
  };
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

  if (isSupabaseConfigured) {
    initSupabaseRealtime();
  }
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
const selSyncStatus = (s: Snapshot) => s.syncStatus;

export const useSettings = () => useDB(selSettings);
export const useCategories = () => useDB(selCategories);
export const useItems = () => useDB(selItems);
export const useTables = () => useDB(selTables);
export const useOrders = () => useDB(selOrders);
export const useCalls = () => useDB(selCalls);
export const useSyncStatus = () => useDB(selSyncStatus);

export function useOrder(id?: string) {
  const sel = useCallback((s: Snapshot) => s.orders.find((o) => o.id === id || o.code === id), [id]);
  return useDB(sel);
}

/* --------------------------------- pricing -------------------------------- */

export function priceOrder(lines: CartLine[], s: Settings) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const isTaxOn = Boolean(s.taxEnabled) && Number(s.taxPercent) > 0;
  const isServiceOn = Boolean(s.serviceEnabled) && Number(s.servicePercent) > 0;

  const taxAmount = isTaxOn ? (subtotal * s.taxPercent) / 100 : 0;
  const serviceAmount = isServiceOn ? (subtotal * s.servicePercent) / 100 : 0;
  return {
    subtotal,
    taxAmount: Math.round(taxAmount * 100) / 100,
    serviceAmount: Math.round(serviceAmount * 100) / 100,
    total: Math.round((subtotal + taxAmount + serviceAmount) * 100) / 100,
  };
}

/* --------------------------------- actions -------------------------------- */

export const actions = {
  syncWithSupabase() {
    return fetchFromSupabase();
  },

  injectOrder(order: Order) {
    mutate((d) => {
      const idx = d.orders.findIndex((o) => o.id === order.id || o.code === order.code);
      if (idx >= 0) {
        d.orders[idx] = { ...d.orders[idx], ...order };
      } else {
        d.orders.unshift(order);
      }
    });
  },

  async placeOrder(input: {
    tableCode: string;
    diningMode?: 'Dine-in' | 'Takeaway';
    lines: CartLine[];
    customerName: string;
    customerPhone?: string;
    note?: string;
    paymentMode: Order['paymentMode'];
  }): Promise<Order> {
    const s = db.settings;
    const totals = priceOrder(input.lines, s);
    const now = Date.now();
    const isTaxOn = Boolean(s.taxEnabled) && Number(s.taxPercent) > 0;
    const isServiceOn = Boolean(s.serviceEnabled) && Number(s.servicePercent) > 0;

    const order: Order = {
      id: uid('o_'),
      code: orderCode(),
      tableCode: input.tableCode,
      diningMode: input.diningMode || 'Dine-in',
      customerName: input.customerName.trim() || 'Guest',
      customerPhone: input.customerPhone,
      lines: input.lines,
      note: input.note,
      ...totals,
      taxPercent: isTaxOn ? s.taxPercent : 0,
      servicePercent: isServiceOn ? s.servicePercent : 0,
      status: 'PREPARING',
      createdAt: now,
      updatedAt: now,
      timeline: [
        { status: 'PREPARING', at: now, by: 'Direct to Kitchen' },
      ],
      paymentMode: input.paymentMode,
    };

    mutate((d) => {
      d.orders.unshift(order);
    });

    if (supabase) {
      try {
        const { error } = await supabase.from('orders').insert(mapOrderToDb(order));
        if (error) console.error('Supabase placeOrder error:', error);
      } catch (err) {
        console.error('Failed to insert order to Supabase:', err);
      }
    }

    return order;
  },

  async setOrderStatus(id: string, status: OrderStatus, by = 'Staff', note?: string) {
    let updatedOrder: Order | undefined;
    mutate((d) => {
      const o = d.orders.find((x) => x.id === id);
      if (!o) return;
      o.status = status;
      o.updatedAt = Date.now();
      if (note) {
        o.note = o.note ? `${o.note} [${note}]` : `[${note}]`;
      }
      o.timeline.push({ status, at: Date.now(), by: note ? `${by} (${note})` : by });
      updatedOrder = o;
    });

    if (supabase && updatedOrder) {
      if (status === 'CANCELLED') {
        const res = await cancelOrderServer(id, note || by, by);
        if (!res.success) {
          supabase
            .from('orders')
            .update(mapOrderToDb(updatedOrder))
            .eq('id', id)
            .then(({ error }) => {
              if (error) console.error('Supabase setOrderStatus fallback error:', error);
            });
        }
      } else {
        supabase
          .from('orders')
          .update(mapOrderToDb(updatedOrder))
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.error('Supabase setOrderStatus error:', error);
          });
      }
    }
  },

  async submitOrderReview(
    orderId: string,
    reviews: Record<string, { rating: number; comment?: string; tags?: string[] }>,
    overallComment?: string,
  ) {
    let updatedOrder: Order | undefined;
    const now = Date.now();
    mutate((d) => {
      const o = d.orders.find((x) => x.id === orderId || x.code === orderId);
      if (!o) return;
      o.reviewedAt = now;
      if (overallComment) {
        o.customerReview = overallComment;
      }
      o.lines.forEach((line) => {
        const rev = reviews[line.lineId] || reviews[line.itemId];
        if (rev && rev.rating > 0) {
          line.rating = rev.rating;
          line.reviewComment = rev.comment || undefined;
          line.reviewTags = rev.tags || undefined;
          line.reviewedAt = now;
        }
      });
      o.updatedAt = now;
      updatedOrder = o;
    });

    if (supabase && updatedOrder) {
      try {
        const { error } = await supabase
          .from('orders')
          .update(mapOrderToDb(updatedOrder))
          .eq('id', updatedOrder.id);
        if (error) console.error('Supabase submitOrderReview error:', error);
      } catch (err) {
        console.error('Failed to submit order review to Supabase:', err);
      }
    }
  },

  callStaff(tableCode: string, reason: CallReason, note?: string) {
    try {
      playStaffCallAlert(tableCode);
    } catch {
      /* ignore audio errors */
    }

    const call: StaffCall = {
      id: uid('c_'),
      tableCode,
      reason,
      note,
      createdAt: Date.now(),
      resolved: false,
    };
    mutate((d) => {
      d.calls.push(call);
    });

    if (supabase) {
      supabase
        .from('staff_calls')
        .insert(mapCallToDb(call))
        .then(({ error }) => {
          if (error) console.error('Supabase callStaff error:', error);
        });
    }

    return call;
  },

  resolveCall(id: string) {
    mutate((d) => {
      const c = d.calls.find((x) => x.id === id);
      if (c) c.resolved = true;
    });

    if (supabase) {
      supabase
        .from('staff_calls')
        .update({ resolved: true })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Supabase resolveCall error:', error);
        });
    }
  },

  saveItem(item: MenuItem) {
    mutate((d) => {
      const i = d.items.findIndex((x) => x.id === item.id);
      if (i >= 0) d.items[i] = item;
      else d.items.unshift(item);
    });

    if (supabase) {
      supabase
        .from('menu_items')
        .upsert(mapItemToDb(item))
        .then(({ error }) => {
          if (error) console.error('Supabase saveItem error:', error);
        });
    }
  },

  deleteItem(id: string) {
    mutate((d) => {
      d.items = d.items.filter((x) => x.id !== id);
    });

    if (supabase) {
      supabase
        .from('menu_items')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Supabase deleteItem error:', error);
        });
    }
  },

  toggleSoldOut(id: string) {
    let soldOutState = false;
    mutate((d) => {
      const it = d.items.find((x) => x.id === id);
      if (it) {
        it.soldOut = !it.soldOut;
        soldOutState = it.soldOut;
      }
    });

    if (supabase) {
      supabase
        .from('menu_items')
        .update({ sold_out: soldOutState })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Supabase toggleSoldOut error:', error);
        });
    }
  },

  saveCategory(cat: Category) {
    mutate((d) => {
      const i = d.categories.findIndex((c) => c.id === cat.id);
      if (i >= 0) d.categories[i] = cat;
      else d.categories.push(cat);
    });

    if (supabase) {
      supabase
        .from('categories')
        .upsert(mapCategoryToDb(cat))
        .then(({ error }) => {
          if (error) console.error('Supabase saveCategory error:', error);
        });
    }
  },

  deleteCategory(id: string) {
    mutate((d) => {
      d.categories = d.categories.filter((c) => c.id !== id);
      d.items = d.items.filter((i) => i.categoryId !== id);
    });

    if (supabase) {
      supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Supabase deleteCategory error:', error);
        });
    }
  },

  saveTable(table: CafeTable) {
    mutate((d) => {
      const i = d.tables.findIndex((t) => t.id === table.id);
      if (i >= 0) d.tables[i] = table;
      else d.tables.push(table);
    });

    if (supabase) {
      supabase
        .from('cafe_tables')
        .upsert(mapTableToDb(table))
        .then(({ error }) => {
          if (error) console.error('Supabase saveTable error:', error);
        });
    }
  },

  deleteTable(id: string) {
    mutate((d) => {
      d.tables = d.tables.filter((t) => t.id !== id);
    });

    if (supabase) {
      supabase
        .from('cafe_tables')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Supabase deleteTable error:', error);
        });
    }
  },

  saveSettings(patch: Partial<Settings>) {
    mutate((d) => {
      d.settings = { ...d.settings, ...patch };
    });

    if (patch.offer) {
      try {
        localStorage.setItem('ivan_cafe_offer', JSON.stringify(patch.offer));
      } catch {}
    }

    if (supabase) {
      supabase
        .from('settings')
        .upsert(mapSettingsToDb(db.settings))
        .then(({ error }) => {
          if (error) console.error('Supabase saveSettings error:', error);
        });
    }
  },

  clearOrders() {
    mutate((d) => {
      d.orders = [];
      d.calls = [];
    });

    if (supabase) {
      supabase
        .from('orders')
        .delete()
        .neq('id', '___all___')
        .then(({ error }) => {
          if (error) console.error('Supabase clearOrders error:', error);
        });
      supabase
        .from('staff_calls')
        .delete()
        .neq('id', '___all___')
        .then(({ error }) => {
          if (error) console.error('Supabase clearCalls error:', error);
        });
    }
  },

  resetAll() {
    db = seedDB();
    persist();

    if (supabase) {
      const client = supabase;
      (async () => {
        try {
          await client.from('categories').upsert(db.categories.map(mapCategoryToDb));
          await client.from('menu_items').upsert(db.items.map(mapItemToDb));
          await client.from('cafe_tables').upsert(db.tables.map(mapTableToDb));
          await client.from('settings').upsert(mapSettingsToDb(db.settings));
        } catch (err) {
          console.error('Supabase resetAll error:', err);
        }
      })();
    }
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

    const newOrders = [
      mk('T03', [1, 10, 20], 'RECEIVED', 3),
      mk('T05', [14, 18], 'PREPARING', 11),
      mk('T02', [4, 21], 'READY', 17),
      mk('T07', [6, 12], 'SERVED', 64),
      mk('T01', [2, 9, 15], 'SERVED', 140),
    ];

    mutate((d) => {
      d.orders.push(...newOrders);
    });

    if (supabase) {
      supabase
        .from('orders')
        .insert(newOrders.map(mapOrderToDb))
        .then(({ error }) => {
          if (error) console.error('Supabase seedDemoOrders error:', error);
        });
    }
  },
};
