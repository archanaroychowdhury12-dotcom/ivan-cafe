import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { CafeTable, Category, MenuItem, Order, Settings, StaffCall } from './types';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-id'),
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  : null;

/* ---------------------------------- mappers --------------------------------- */

export function mapCategoryFromDb(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji || '🍽️',
    sort: Number(row.sort ?? 0),
  };
}

export function mapCategoryToDb(c: Category) {
  return {
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    sort: c.sort,
  };
}

export function mapItemFromDb(row: any): MenuItem {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price ?? 0),
    image: row.image || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    veg: Boolean(row.veg),
    popular: Boolean(row.popular),
    soldOut: Boolean(row.sold_out),
    prepMins: Number(row.prep_mins ?? 15),
    addonGroups: Array.isArray(row.addon_groups) ? row.addon_groups : [],
    createdAt: Number(row.created_at ?? Date.now()),
  };
}

export function mapItemToDb(item: MenuItem) {
  return {
    id: item.id,
    category_id: item.categoryId,
    name: item.name,
    description: item.description,
    price: item.price,
    image: item.image,
    tags: item.tags,
    veg: item.veg,
    popular: Boolean(item.popular),
    sold_out: Boolean(item.soldOut),
    prep_mins: item.prepMins,
    addon_groups: item.addonGroups,
    created_at: item.createdAt,
  };
}

export function mapTableFromDb(row: any): CafeTable {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    seats: Number(row.seats ?? 4),
    zone: row.zone || 'Main',
    active: Boolean(row.active),
  };
}

export function mapTableToDb(table: CafeTable) {
  return {
    id: table.id,
    code: table.code,
    label: table.label,
    seats: table.seats,
    zone: table.zone,
    active: table.active,
  };
}

export function mapOrderFromDb(row: any): Order {
  const rawNote = row.note || '';
  const isTakeaway = rawNote.includes('[Takeaway]') || row.dining_mode === 'Takeaway';
  const cleanNote = rawNote.replace('[Takeaway]', '').trim() || undefined;

  return {
    id: row.id,
    code: row.code,
    tableCode: row.table_code,
    diningMode: isTakeaway ? 'Takeaway' : 'Dine-in',
    customerName: row.customer_name || 'Guest',
    customerPhone: row.customer_phone || undefined,
    lines: Array.isArray(row.lines) ? row.lines : [],
    note: cleanNote,
    subtotal: Number(row.subtotal ?? 0),
    taxAmount: Number(row.tax_amount ?? 0),
    serviceAmount: Number(row.service_amount ?? 0),
    total: Number(row.total ?? 0),
    taxPercent: Number(row.tax_percent ?? 0),
    servicePercent: Number(row.service_percent ?? 0),
    status: row.status,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    timeline: Array.isArray(row.timeline) ? row.timeline : [],
    paymentMode: row.payment_mode || 'COUNTER',
    reviewedAt: (Array.isArray(row.lines) && row.lines.find((l: any) => l.reviewedAt)?.reviewedAt) || undefined,
  };
}

export function mapOrderToDb(o: Order) {
  let noteValue = o.note || null;
  if (o.diningMode === 'Takeaway') {
    noteValue = noteValue ? `[Takeaway] ${noteValue}` : '[Takeaway]';
  }

  return {
    id: o.id,
    code: o.code,
    table_code: o.tableCode,
    customer_name: o.customerName,
    customer_phone: o.customerPhone || null,
    lines: o.lines,
    note: noteValue,
    subtotal: o.subtotal,
    tax_amount: o.taxAmount,
    service_amount: o.serviceAmount,
    total: o.total,
    tax_percent: o.taxPercent,
    service_percent: o.servicePercent,
    status: o.status,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
    timeline: o.timeline,
    payment_mode: o.paymentMode,
  };
}

export function mapCallFromDb(row: any): StaffCall {
  return {
    id: row.id,
    tableCode: row.table_code,
    reason: row.reason,
    note: row.note || undefined,
    createdAt: Number(row.created_at),
    resolved: Boolean(row.resolved),
  };
}

export function mapCallToDb(c: StaffCall) {
  return {
    id: c.id,
    table_code: c.tableCode,
    reason: c.reason,
    note: c.note || null,
    created_at: c.createdAt,
    resolved: c.resolved,
  };
}

export function mapSettingsFromDb(row: any, fallback: Settings): Settings {
  if (!row) return fallback;
  let parsedOffer = fallback.offer;
  let webhookSecretVal = row.webhook_secret || '';
  if (typeof webhookSecretVal === 'string' && webhookSecretVal.startsWith('OFFER_JSON:')) {
    try {
      parsedOffer = JSON.parse(webhookSecretVal.slice('OFFER_JSON:'.length));
      webhookSecretVal = '';
    } catch {
      /* keep fallback */
    }
  } else if (row.offer && typeof row.offer === 'object') {
    parsedOffer = row.offer;
  }

  return {
    cafeName: row.cafe_name || fallback.cafeName,
    tagline: row.tagline || fallback.tagline,
    currency: row.currency || fallback.currency,
    taxPercent: Number(row.tax_percent ?? fallback.taxPercent),
    taxEnabled: Boolean(row.tax_enabled ?? (Number(row.tax_percent ?? 0) > 0)),
    servicePercent: Number(row.service_percent ?? fallback.servicePercent),
    serviceEnabled: Boolean(row.service_enabled),
    acceptingOrders: Boolean(row.accepting_orders ?? true),
    address: row.address || fallback.address,
    hours: row.hours || fallback.hours,
    adminUser: row.admin_user || fallback.adminUser,
    adminPassHash: row.admin_pass_hash || fallback.adminPassHash,
    adminPass: (typeof localStorage !== 'undefined' && localStorage.getItem('ivan_admin_pass')) || fallback.adminPass || 'ivan2026',
    customDomain: row.custom_domain || fallback.customDomain,
    webhookUrl: row.webhook_url || '',
    webhookSecret: webhookSecretVal,
    webhookEnabled: Boolean(row.webhook_enabled),
    autoPrintOrders: Boolean(row.auto_print_orders),
    offer: parsedOffer,
  };
}

export function mapSettingsToDb(s: Settings) {
  return {
    id: 'default',
    cafe_name: s.cafeName,
    tagline: s.tagline,
    currency: s.currency,
    tax_percent: s.taxPercent,
    tax_enabled: Boolean(s.taxEnabled),
    service_percent: s.servicePercent,
    service_enabled: Boolean(s.serviceEnabled),
    accepting_orders: s.acceptingOrders,
    address: s.address,
    hours: s.hours,
    admin_user: s.adminUser,
    admin_pass_hash: s.adminPassHash,
    custom_domain: s.customDomain || null,
    webhook_url: s.webhookUrl || '',
    webhook_secret: s.offer ? `OFFER_JSON:${JSON.stringify(s.offer)}` : (s.webhookSecret || ''),
    webhook_enabled: Boolean(s.webhookEnabled),
    auto_print_orders: Boolean(s.autoPrintOrders),
  };
}

export function mapAuditLogFromDb(row: any) {
  return {
    id: row.id,
    orderId: row.order_id,
    orderCode: row.order_code,
    action: row.action,
    oldStatus: row.old_status || undefined,
    newStatus: row.new_status || undefined,
    actor: row.actor || 'system',
    note: row.note || undefined,
    changes: row.changes || {},
    snapshot: row.snapshot || {},
    createdAt: row.created_at,
  };
}

export function mapWebhookEventFromDb(row: any) {
  return {
    id: row.id,
    eventType: row.event_type,
    aggregateId: row.aggregate_id,
    payload: row.payload || {},
    status: row.status,
    attempts: Number(row.attempts || 0),
    maxAttempts: Number(row.max_attempts || 5),
    nextRetryAt: row.next_retry_at,
    lastError: row.last_error || undefined,
    responseStatus: row.response_status != null ? Number(row.response_status) : undefined,
    responseBody: row.response_body || undefined,
    deliveredAt: row.delivered_at || undefined,
    createdAt: row.created_at,
  };
}

/* --------------------------- server-side RPC & helpers --------------------------- */

export async function cancelOrderServer(
  orderIdOrCode: string,
  reason: string = 'Customer requested cancellation',
  by: string = 'customer'
): Promise<{ success: boolean; error?: string; message?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database client not initialized' };
  }

  try {
    const { data, error } = await supabase.rpc('cancel_order', {
      p_order_id: orderIdOrCode,
      p_reason: reason,
      p_by: by,
    });

    if (error) {
      console.warn('RPC cancel_order error:', error);
      return { success: false, error: error.message };
    }

    return (data as { success: boolean; error?: string; message?: string }) || { success: true };
  } catch (err: any) {
    console.error('cancelOrderServer invocation failed:', err);
    return { success: false, error: err.message || 'Invocation failed' };
  }
}

export async function retryWebhooksServer(): Promise<{ success: boolean; resetCount: number; error?: string }> {
  if (!supabase) {
    return { success: false, resetCount: 0, error: 'Database client not initialized' };
  }

  try {
    const { data, error } = await supabase.rpc('retry_failed_webhooks');
    if (error) throw error;
    return { success: true, resetCount: Number(data || 0) };
  } catch (err: any) {
    console.error('retryWebhooksServer failed:', err);
    return { success: false, resetCount: 0, error: err.message };
  }
}

export async function fetchOrderAuditLogs(orderId?: string) {
  if (!supabase) return [];
  try {
    let query = supabase
      .from('order_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (orderId) {
      query = query.or(`order_id.eq.${orderId},order_code.eq.${orderId}`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching audit logs:', error);
      return [];
    }
    return (data || []).map(mapAuditLogFromDb);
  } catch {
    return [];
  }
}

export async function fetchWebhookEvents(limit: number = 30) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('webhook_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Error fetching webhook events:', error);
      return [];
    }
    return (data || []).map(mapWebhookEventFromDb);
  } catch {
    return [];
  }
}
