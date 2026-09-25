export type OrderStatus = 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED' | 'RECEIVED' | 'CONFIRMED';

export const FLOW: OrderStatus[] = ['PREPARING', 'READY', 'SERVED'];


export interface AddonOption {
  id: string;
  name: string;
  price: number;
}

export interface AddonGroup {
  id: string;
  name: string;
  type: 'single' | 'multi';
  required?: boolean;
  max?: number;
  options: AddonOption[];
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  sort: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tags: string[];
  veg: boolean;
  popular?: boolean;
  soldOut?: boolean;
  prepMins: number;
  addonGroups: AddonGroup[];
  createdAt: number;
}

export interface CafeTable {
  id: string;
  code: string;
  label: string;
  seats: number;
  zone: string;
  active: boolean;
}

export interface CartLine {
  lineId: string;
  itemId: string;
  name: string;
  image: string;
  unitPrice: number;
  basePrice: number;
  qty: number;
  addons: { groupName: string; optionName: string; price: number }[];
  note?: string;
  rating?: number; // 1 to 5 stars
  reviewComment?: string;
  reviewTags?: string[];
  reviewedAt?: number;
}

export interface ItemReview {
  orderId: string;
  orderCode: string;
  tableCode: string;
  customerName: string;
  itemId: string;
  itemName: string;
  itemImage: string;
  rating: number; // 1 - 5
  comment?: string;
  tags?: string[];
  createdAt: number;
}

export interface ItemRatingStats {
  itemId: string;
  averageRating: number;
  totalReviews: number;
  starCounts: { 1: number; 2: number; 3: number; 4: number; 5: number };
  recentReviews: ItemReview[];
  satisfactionPercent: number;
}

export interface TimelineEntry {
  status: OrderStatus;
  at: number;
  by: string;
}

export interface Order {
  id: string;
  code: string;
  tableCode: string;
  diningMode?: 'Dine-in' | 'Takeaway';
  customerName: string;
  customerPhone?: string;
  lines: CartLine[];
  note?: string;
  subtotal: number;
  taxAmount: number;
  serviceAmount: number;
  total: number;
  taxPercent: number;
  servicePercent: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  timeline: TimelineEntry[];
  paymentMode: 'COUNTER' | 'UPI' | 'CARD';
  reviewedAt?: number;
  customerReview?: string;
}

export type CallReason = 'Assistance' | 'Water refill' | 'Cutlery' | 'Request bill' | 'Cleaning';

export interface StaffCall {
  id: string;
  tableCode: string;
  reason: CallReason;
  note?: string;
  createdAt: number;
  resolved: boolean;
}

export interface PromoOffer {
  enabled: boolean;
  tag: string;
  title: string;
  subtitle: string;
  buttonText: string;
  image: string;
  targetCategory?: string;
  discountPercent?: number;
}

export interface Settings {
  cafeName: string;
  tagline: string;
  currency: string;
  taxPercent: number;
  taxEnabled: boolean;
  servicePercent: number;
  serviceEnabled: boolean;
  acceptingOrders: boolean;
  address: string;
  hours: string;
  adminUser: string;
  adminPassHash: string;
  adminPass?: string;
  customDomain?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  webhookEnabled?: boolean;
  autoPrintOrders?: boolean;
  offer?: PromoOffer;
}

export interface OrderAuditLog {
  id: string;
  orderId: string;
  orderCode: string;
  action: string;
  oldStatus?: string;
  newStatus?: string;
  actor: string;
  note?: string;
  changes?: Record<string, any>;
  snapshot?: Record<string, any>;
  createdAt: string;
}

export interface WebhookEvent {
  id: string;
  eventType: string;
  aggregateId: string;
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'delivered' | 'failed';
  attempts: number;
  maxAttempts: number;
  nextRetryAt: string;
  lastError?: string;
  responseStatus?: number;
  responseBody?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface DB {
  version: number;
  settings: Settings;
  categories: Category[];
  items: MenuItem[];
  tables: CafeTable[];
  orders: Order[];
  calls: StaffCall[];
}
