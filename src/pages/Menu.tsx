import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellRing,
  CakeSlice,
  ChefHat,
  ChevronDown,
  ChevronRight,
  Clock,
  Coffee,
  CupSoda,
  Flame,
  GlassWater,
  LayoutGrid,
  Leaf,
  Menu as MenuIcon,
  Search,
  ShoppingBag,
  Soup,
  Sparkles,
  Utensils,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useCart, cart } from '../lib/cart';
import { actions, useCategories, useItems, useOrders, useSettings, useTables } from '../lib/store';
import { money } from '../lib/format';
import type { CallReason, MenuItem } from '../lib/types';
import { ItemCard, KitchenDisplayCard } from '../components/customer/ItemCard';
import { ItemSheet } from '../components/customer/ItemSheet';
import { BottomNav } from '../components/customer/BottomNav';
import { Button, Chip, EmptyState, Sheet, useToast } from '../components/ui';
import { Mark } from '../components/Brand';
import { blip } from '../lib/sound';

const REASONS: CallReason[] = ['Assistance', 'Water refill', 'Cutlery', 'Request bill', 'Cleaning'];

// Icon mapping for category pills
const getCategoryIcon = (id: string) => {
  switch (id) {
    case 'all':
      return LayoutGrid;
    case 'c-tea':
      return Leaf;
    case 'c-coffee':
      return Coffee;
    case 'c-chicken-snacks':
      return Utensils;
    case 'c-shawarma':
      return ChefHat;
    case 'c-starters':
      return Flame;
    case 'c-noodles':
      return UtensilsCrossed;
    case 'c-rice':
      return UtensilsCrossed;
    case 'c-soups':
      return Soup;
    case 'c-lassi':
      return CupSoda;
    case 'c-mocktails':
      return GlassWater;
    case 'c-egg-lolly':
      return ChefHat;
    default:
      return Utensils;
  }
};

const getCategoryHeaderIcon = (id: string, emoji?: string) => {
  switch (id) {
    case 'c-chicken-snacks':
      return '🍗';
    case 'c-coffee':
      return '☕';
    case 'c-tea':
      return '🍵';
    case 'c-shawarma':
      return '🌯';
    case 'c-starters':
      return '🔥';
    case 'c-noodles':
      return '🍜';
    case 'c-rice':
      return '🍚';
    case 'c-soups':
      return '🍲';
    case 'c-lassi':
      return '🥤';
    case 'c-mocktails':
      return '🍹';
    case 'c-egg-lolly':
      return '🍳';
    default:
      return emoji || '🍽️';
  }
};

const getCategorySubtitle = (id: string) => {
  switch (id) {
    case 'c-chicken-snacks':
      return 'Crispy, flavorful and always a good choice!';
    case 'c-coffee':
      return 'Freshly brewed aromatic blends & signature lattes';
    case 'c-tea':
      return 'Traditional malai cha & refreshing organic infusions';
    case 'c-shawarma':
      return 'Juicy stuffed rolls & crispy spiced skewers';
    case 'c-starters':
      return 'Sizzling hot appetizers, tossed in savory sauces';
    case 'c-noodles':
      return 'Wok-tossed hakka & schezwan noodles with crunch';
    case 'c-rice':
      return 'Fragrant garlic & fried rice seasoned to perfection';
    case 'c-soups':
      return 'Comforting, steaming bowls with crispy fried noodles';
    case 'c-lassi':
      return 'Thick, creamy traditional yogurt blends with rich nuts';
    case 'c-mocktails':
      return 'Chilled sparkling refreshments & colorful fruit fusions';
    case 'c-egg-lolly':
      return 'Crispy seasoned egg skewers fried to golden crunch';
    default:
      return 'Freshly prepared, hot & delicious for your table';
  }
};

export default function MenuPage() {
  const [params, setParams] = useSearchParams();
  const settings = useSettings();
  const categories = useCategories();
  const items = useItems();
  const tables = useTables();
  const orders = useOrders();
  const toast = useToast();

  // If no table param, default gracefully to T01
  const tableParam = (params.get('table') || 'T01').toUpperCase();
  const table = tables.find((t) => t.code === tableParam) || tables[0] || {
    id: 't1',
    code: 'T01',
    label: 'Window Two-Top',
    seats: 2,
    zone: 'Window',
    active: true,
  };

  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string>('all');
  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [ordersSheetOpen, setOrdersSheetOpen] = useState(false);
  const [reason, setReason] = useState<CallReason>('Assistance');
  const [callNote, setCallNote] = useState('');
  const [diningMode, setDiningMode] = useState<'Dine-in' | 'Takeaway'>('Dine-in');

  const liveOrders = orders.filter(
    (o) => o.tableCode === table.code && o.status !== 'SERVED' && o.status !== 'CANCELLED',
  );

  const lines = useCart(table.code || 'T01');
  const cartCount = lines.reduce((s, l) => s + l.qty, 0);
  const cartTotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  const qtyOf = (id: string) =>
    lines.filter((l) => l.itemId === id).reduce((s, l) => s + l.qty, 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      const matchQ =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.tags.join(' ').toLowerCase().includes(q);
      const matchC = activeCat === 'all' || i.categoryId === activeCat;
      return matchQ && matchC;
    });
  }, [items, query, activeCat]);

  // Group items by category
  const grouped = useMemo(() => {
    return categories
      .map((c) => ({ cat: c, list: filtered.filter((i) => i.categoryId === c.id) }))
      .filter((g) => g.list.length > 0);
  }, [categories, filtered]);

  // Find Chinese Sizzler or special item for Kitchen Display section
  const specialItem = items.find(
    (i) => i.name.toLowerCase().includes('chinese sizzler') || i.tags.includes('Chef Special')
  ) || items[0];

  const handleDirectAdd = (item: MenuItem, qty: number) => {
    cart.add(table.code, {
      lineId: `${item.id}-${Date.now()}`,
      itemId: item.id,
      name: item.name,
      image: item.image,
      unitPrice: item.price,
      basePrice: item.price,
      qty,
      addons: [],
    });
    blip();
    toast(`${qty}x ${item.name} added to cart`);
  };

  const handleDirectRemove = (item: MenuItem) => {
    const tableCart = cart.get(table.code);
    const existing = tableCart.find((l) => l.itemId === item.id);
    if (existing) {
      if (existing.qty > 1) {
        cart.setQty(table.code, existing.lineId, existing.qty - 1);
      } else {
        cart.remove(table.code, existing.lineId);
      }
      blip();
    }
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-[#FAF6F0] text-stone-900 pb-28 relative selection:bg-amber-600 selection:text-white font-sans antialiased">
      {/* ---------------------------------------------------- */}
      {/* 1. HERO HEADER AREA                                  */}
      {/* ---------------------------------------------------- */}
      <header className="relative bg-[#17110D] text-white pt-6 pb-12 px-5 overflow-hidden">
        {/* Background ambient lighting and textures */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#3d281a_0%,#17110d_70%)] opacity-90 pointer-events-none" />
        <div className="absolute -top-16 -right-16 h-72 w-72 rounded-full bg-amber-600/15 blur-3xl pointer-events-none" />

        {/* Top bar: Hamburger, Brand Center, Call Staff & Table selector Right */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          {/* Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 hover:bg-white/15 text-white/90 backdrop-blur-md transition active:scale-95"
            aria-label="Open menu options"
          >
            <MenuIcon size={20} strokeWidth={2.2} />
          </button>

          {/* Center Brand Title - Styled exactly like media_1789455970200.png */}
          <div className="text-center min-w-0 flex-1">
            <div className="flex items-center justify-center gap-1.5 leading-none">
              <span className="font-editorial text-[19px] sm:text-[21px] font-black tracking-wider text-[#FFB3C1] drop-shadow-[0_0_10px_rgba(255,179,193,0.55)]">
                IVAN
              </span>
              <span className="text-amber-300 text-[18px] filter drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]">
                ☕
              </span>
              <span className="font-editorial text-[19px] sm:text-[21px] font-black tracking-wider text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.45)]">
                CAFFE
              </span>
            </div>
            <p className="text-[9px] font-bold tracking-[0.24em] text-[#D8B99A] uppercase mt-1">
              — GOOD FOOD · GOOD MOOD —
            </p>
          </div>

          {/* Right Action Buttons: Call Staff & Table */}
          <div className="flex items-center gap-2 shrink-0">
            {/* CALL STAFF BUTTON - EXTRA PROMINENT & EYE-CATCHING */}
            <button
              type="button"
              onClick={() => setCallOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-stone-950 px-3 py-2 shadow-lg shadow-amber-500/30 border border-amber-300 transition active:scale-95 ring-2 ring-amber-400/30"
              title="Call staff or waiter to your table"
            >
              <BellRing size={17} className="text-stone-950 fill-stone-950/25 animate-bounce shrink-0" />
              <span className="text-[12px] font-black tracking-wide uppercase leading-none">Call Staff</span>
            </button>

            {/* Table Selection Badge */}
            <button
              type="button"
              onClick={() => setTableModalOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 px-2.5 py-2 backdrop-blur-md transition active:scale-95 text-left shadow-sm"
            >
              <div>
                <p className="text-[11.5px] font-bold text-white leading-none">
                  {table.code}
                </p>
                <div className="flex items-center gap-0.5 text-[9px] text-[#D8B99A] font-medium leading-tight mt-0.5">
                  <span>{diningMode}</span>
                  <ChevronDown size={8} />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Hero Banner Content: Good Food Good Mood (Exact Match to media_1789455970200.png) */}
        <div className="relative z-10 mt-6 grid grid-cols-12 items-center gap-2">
          {/* Left Text with Flourishes */}
          <div className="col-span-6 space-y-1 pl-1">
            <div className="flex items-center justify-between pr-4">
              <span className="text-amber-400 text-lg font-hand leading-none select-none">୧୨</span>
              <span className="text-amber-400 text-lg font-hand leading-none select-none">୨୧</span>
            </div>

            <h2 className="font-hand leading-[1.02] tracking-normal text-left my-0.5">
              <span className="block text-[38px] sm:text-[44px] font-bold text-white drop-shadow-md">
                Good Food
              </span>
              <span className="block text-[42px] sm:text-[48px] font-extrabold text-[#F3C06B] drop-shadow-md -mt-1">
                Good Mood
              </span>
            </h2>

            <div className="flex items-center justify-between pr-4">
              <span className="text-amber-400 text-lg font-hand leading-none select-none">୨୧</span>
              <span className="text-amber-400 text-lg font-hand leading-none select-none">୨୧</span>
            </div>

            <p className="text-[11px] sm:text-[12px] font-medium text-stone-300/90 pt-1 tracking-wide leading-tight">
              Fresh food &bull; Great coffee &bull; Cozy vibes
            </p>
          </div>

          {/* Right Image: Signature Latte Cup with Heart Latte Art */}
          <div className="col-span-6 flex justify-end relative">
            <div className="relative w-full max-w-[210px] overflow-hidden rounded-2xl shadow-2xl">
              <img
                src="/brand/hero_coffee_exact.jpg"
                alt="Signature Coffee with Heart Latte Art"
                className="w-full h-auto object-cover scale-105"
              />
              <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#17110D] to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#17110D]/70 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* 2. MAIN CURVED SHEET CONTAINER                       */}
      {/* ---------------------------------------------------- */}
      <div className="relative -mt-6 rounded-t-[34px] bg-[#FAF6F0] px-4 pt-4 pb-6 border-t border-[#EADECE]/80 shadow-2xl">
        {/* Quick Top Call Staff Bar - Extra Large & Prominent */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setCallOpen(true)}
            className="w-full flex items-center justify-between rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border-2 border-amber-500/40 p-3 text-amber-950 shadow-sm transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500 text-stone-950 shadow-md shadow-amber-500/30 shrink-0">
                <BellRing size={20} className="animate-pulse" />
              </div>
              <div className="text-left">
                <p className="text-[14px] font-black leading-tight text-stone-900">
                  Need Staff? Call Waiter
                </p>
                <p className="text-[11px] font-medium text-stone-600 mt-0.5">
                  Water, cutlery, assistance or request bill
                </p>
              </div>
            </div>

            <span className="rounded-xl bg-white px-3 py-1.5 text-[11.5px] font-bold text-amber-900 border border-amber-200/80 shadow-xs shrink-0">
              Table {table.code}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for food, drinks, or desserts..."
            className="w-full rounded-full bg-white border border-[#E7DCCE] py-3.5 pl-11 pr-10 text-[13.5px] text-stone-900 shadow-sm placeholder:text-stone-400 outline-none transition focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-stone-100 text-stone-500 hover:text-stone-900"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* 3. HORIZONTAL CATEGORY BAR (COMPACT PILL CHIPS)     */}
        {/* ---------------------------------------------------- */}
        <div className="no-scrollbar -mx-4 mt-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
          {/* ALL Category Pill */}
          <button
            type="button"
            onClick={() => setActiveCat('all')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 transition-all shrink-0 text-[12.5px] font-bold shadow-2xs ${
              activeCat === 'all'
                ? 'bg-[#202020] text-white shadow-sm ring-1 ring-stone-900'
                : 'bg-white text-stone-700 border border-[#E7DCCE] hover:bg-[#F8F3EA]'
            }`}
          >
            <LayoutGrid size={15} strokeWidth={2.5} />
            <span>All</span>
          </button>

          {/* Dynamic Category Pills */}
          {categories.map((c) => {
            const Icon = getCategoryIcon(c.id);
            const isActive = activeCat === c.id;
            const displayName = c.name.split(' (')[0];
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCat(c.id)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 transition-all shrink-0 text-[12.5px] font-bold shadow-2xs ${
                  isActive
                    ? 'bg-[#F6DFC2] text-stone-900 border border-[#EACBA3] shadow-xs'
                    : 'bg-white text-stone-700 border border-[#E7DCCE] hover:bg-[#F8F3EA]'
                }`}
              >
                <Icon size={15} strokeWidth={2.2} className={isActive ? 'text-amber-800' : 'text-stone-500'} />
                <span>{displayName}</span>
              </button>
            );
          })}
        </div>

        {/* ---------------------------------------------------- */}
        {/* 4. DISH SECTIONS                                     */}
        {/* ---------------------------------------------------- */}
        <div className="mt-5 space-y-8">
          {grouped.length === 0 && (
            <div className="py-12">
              <EmptyState
                icon={<Search size={22} />}
                title="No dishes found"
                sub="Try another dish name, drink or category filter."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery('');
                      setActiveCat('all');
                    }}
                  >
                    Reset filters
                  </Button>
                }
              />
            </div>
          )}

          {grouped.map(({ cat, list }) => {
            const isSpecialSection = cat.id === 'c-chicken-snacks';
            return (
              <section key={cat.id} id={cat.id} className="space-y-3.5">
                {/* Section Header with Icon & item count pill (Matches Reference Design) */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl leading-none">{getCategoryHeaderIcon(cat.id, cat.emoji)}</span>
                    <div>
                      <h2 className="font-editorial text-[21px] font-bold text-stone-900 tracking-tight leading-none">
                        {cat.name.split(' (')[0]}
                      </h2>
                      <p className="text-[11.5px] font-medium text-stone-500 mt-1">
                        {getCategorySubtitle(cat.id)}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-[#EADECE] px-3.5 py-1 text-[11.5px] font-bold text-stone-700 shrink-0">
                    {list.length} items
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {list.map((item, idx) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      index={idx}
                      inCart={qtyOf(item.id)}
                      onOpen={() => setSheetItem(item)}
                      onDirectAdd={(qty) => handleDirectAdd(item, qty)}
                      onDirectRemove={() => handleDirectRemove(item)}
                    />
                  ))}
                </div>

                {/* Chef's Special Kitchen Display spotlight */}
                {isSpecialSection && activeCat === 'all' && !query && specialItem && (
                  <div className="pt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-800 text-lg">🍃</span>
                        <div>
                          <h3 className="font-editorial text-[19px] font-bold uppercase tracking-wide text-stone-900 leading-none">
                            Chef's Specials
                          </h3>
                          <p className="text-[11.5px] font-medium text-stone-500 mt-0.5">
                            Freshly made, just for you
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-[#EADECE] px-3 py-0.5 text-[11.5px] font-bold text-stone-700">
                        Signature
                      </span>
                    </div>

                    <KitchenDisplayCard
                      item={specialItem}
                      onOpen={() => setSheetItem(specialItem)}
                    />
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center pb-6 text-stone-500">
          <p className="font-editorial text-[15px] font-bold text-stone-800">
            {settings.cafeName}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            Table {table.code} &bull; {settings.address}
          </p>
        </footer>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 5. BOTTOM NAVIGATION BAR                             */}
      {/* ---------------------------------------------------- */}
      <BottomNav
        tableCode={table.code}
        cartCount={cartCount}
        activeOrdersCount={liveOrders.length}
        activeTab="menu"
        onOrdersClick={() => setOrdersSheetOpen(true)}
        onMoreClick={() => setMoreOpen(true)}
      />

      {/* ---------------------------------------------------- */}
      {/* 6. MODALS & SHEETS                                   */}
      {/* ---------------------------------------------------- */}
      {/* Item Customization Sheet */}
      <ItemSheet
        item={sheetItem}
        open={!!sheetItem}
        onClose={() => setSheetItem(null)}
        onAdd={(line) => {
          cart.add(table.code, line);
          blip();
          toast(`${line.name} added to cart`);
        }}
      />

      {/* Table & Dining Option Modal */}
      <Sheet
        open={tableModalOpen}
        onClose={() => setTableModalOpen(false)}
        title="Dining Options & Table"
      >
        <div className="space-y-5 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Select Dining Mode
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiningMode('Dine-in')}
                className={`rounded-xl py-3 px-4 text-sm font-bold border transition ${
                  diningMode === 'Dine-in'
                    ? 'bg-[#18392B] text-white border-[#18392B]'
                    : 'bg-white text-stone-700 border-stone-300'
                }`}
              >
                🍽️ Dine-in
              </button>
              <button
                type="button"
                onClick={() => setDiningMode('Takeaway')}
                className={`rounded-xl py-3 px-4 text-sm font-bold border transition ${
                  diningMode === 'Takeaway'
                    ? 'bg-[#18392B] text-white border-[#18392B]'
                    : 'bg-white text-stone-700 border-stone-300'
                }`}
              >
                🛍️ Takeaway
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Select Your Table
            </p>
            <div className="grid grid-cols-4 gap-2">
              {tables
                .filter((t) => t.active)
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setParams({ table: t.code });
                      setTableModalOpen(false);
                      toast(`Switched to Table ${t.code}`);
                    }}
                    className={`rounded-xl py-3 text-center border font-display text-base font-bold transition ${
                      t.code === table.code
                        ? 'bg-[#18392B] text-white border-[#18392B] shadow-sm'
                        : 'bg-white text-stone-800 border-stone-300 hover:border-amber-700'
                    }`}
                  >
                    {t.code}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </Sheet>

      {/* Customer Orders Sheet */}
      <Sheet
        open={ordersSheetOpen}
        onClose={() => setOrdersSheetOpen(false)}
        title={`Active Orders · Table ${table.code}`}
      >
        <div className="space-y-4 px-5 py-4">
          {liveOrders.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-stone-100 text-stone-400 mb-3">
                <Clock size={24} />
              </div>
              <h3 className="font-display text-base font-bold text-stone-900">
                No active orders right now
              </h3>
              <p className="mt-1 text-xs text-stone-500 max-w-xs mx-auto">
                Items you order from Table {table.code} will appear here with live preparation status from our kitchen.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {liveOrders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                    <div>
                      <p className="font-mono text-xs font-bold text-stone-500">ORDER {o.code}</p>
                      <p className="font-display text-sm font-bold text-stone-900">
                        {money(o.total)}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-800 uppercase">
                      {o.status}
                    </span>
                  </div>
                  <div className="mt-2.5 space-y-1">
                    {o.lines.map((l) => (
                      <p key={l.lineId} className="text-xs text-stone-600 flex justify-between">
                        <span>{l.qty}x {l.name}</span>
                        <span className="font-medium text-stone-800">{money(l.qty * l.unitPrice)}</span>
                      </p>
                    ))}
                  </div>
                  <Link
                    to={`/order/${o.code}`}
                    onClick={() => setOrdersSheetOpen(false)}
                    className="mt-3 block text-center rounded-xl bg-[#18392B] py-2 text-xs font-bold text-white transition hover:bg-[#122A20]"
                  >
                    View Live Order Tracker →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </Sheet>

      {/* More Options / Drawer Sheet (Customer-facing only!) */}
      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Ivan Food Court">
        <div className="space-y-4 px-5 py-4">
          <div className="rounded-2xl bg-[#F4EFE6] p-4 border border-[#EADECE]">
            <p className="font-editorial text-lg font-bold text-stone-900">{settings.cafeName}</p>
            <p className="text-xs text-stone-600 mt-1">{settings.address}</p>
            <p className="text-xs text-stone-600 mt-0.5">Hours: {settings.hours}</p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                setCallOpen(true);
              }}
              className="flex w-full items-center justify-between rounded-xl bg-white border border-stone-200 p-3.5 font-bold text-stone-800 transition hover:bg-stone-50"
            >
              <div className="flex items-center gap-2.5">
                <BellRing size={18} className="text-amber-700" />
                <span>Call Waiter / Staff</span>
              </div>
              <ChevronRight size={16} className="text-stone-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                setTableModalOpen(true);
              }}
              className="flex w-full items-center justify-between rounded-xl bg-white border border-stone-200 p-3.5 font-bold text-stone-800 transition hover:bg-stone-50"
            >
              <div className="flex items-center gap-2.5">
                <UtensilsCrossed size={18} className="text-emerald-700" />
                <span>Switch Table / Dining Mode</span>
              </div>
              <span className="text-xs font-semibold text-stone-500">Table {table.code}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                setOrdersSheetOpen(true);
              }}
              className="flex w-full items-center justify-between rounded-xl bg-white border border-stone-200 p-3.5 font-bold text-stone-800 transition hover:bg-stone-50"
            >
              <div className="flex items-center gap-2.5">
                <Clock size={18} className="text-amber-700" />
                <span>Track My Orders</span>
              </div>
              {liveOrders.length > 0 && (
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {liveOrders.length} active
                </span>
              )}
            </button>

            <div className="rounded-xl bg-white border border-stone-200 p-3.5 text-stone-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">
                  Guest Wi-Fi
                </span>
                <span className="text-xs font-mono font-bold text-emerald-800">Connected</span>
              </div>
              <p className="mt-1 font-bold text-sm">Ivan-Guest-5G</p>
              <p className="text-xs text-stone-500">Password: coffeeandchill</p>
            </div>
          </div>
        </div>
      </Sheet>

      {/* Staff Call Sheet */}
      <Sheet open={callOpen} onClose={() => setCallOpen(false)} title="Call our staff">
        <div className="space-y-4 px-5 py-5">
          <p className="text-sm text-stone-600">
            A team member will come to <strong className="text-stone-900">Table {table.code}</strong>.
          </p>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <Chip key={r} active={reason === r} onClick={() => setReason(r)}>
                {r}
              </Chip>
            ))}
          </div>
          <textarea
            rows={2}
            value={callNote}
            onChange={(e) => setCallNote(e.target.value.slice(0, 120))}
            placeholder="Anything specific? (optional)"
            className="w-full resize-none rounded-2xl border border-stone-300 bg-white px-4 py-3 text-[14px] outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10"
          />
          <Button
            full
            size="lg"
            onClick={() => {
              actions.callStaff(table.code, reason, callNote.trim() || undefined);
              setCallOpen(false);
              setCallNote('');
              toast('Staff notified — someone is on the way', 'info');
            }}
          >
            <BellRing size={16} /> Send request
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
