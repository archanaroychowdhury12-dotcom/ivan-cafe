export type OrderStatus = 'RECEIVED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';

export const FLOW: OrderStatus[] = ['RECEIVED', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'];

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

export interface Settings {
  cafeName: string;
  tagline: string;
  currency: string;
  taxPercent: number;
  servicePercent: number;
  serviceEnabled: boolean;
  acceptingOrders: boolean;
  address: string;
  hours: string;
  adminUser: string;
  adminPassHash: string;
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
