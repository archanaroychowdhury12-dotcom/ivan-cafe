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
  Rows3,
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
import type { CallReason, Category, MenuItem } from '../lib/types';
import { ItemCard, KitchenDisplayCard } from '../components/customer/ItemCard';
import { ItemSheet } from '../components/customer/ItemSheet';
import { BottomNav } from '../components/customer/BottomNav';
import { Button, Chip, EmptyState, Sheet, useToast } from '../components/ui';
import { Mark } from '../components/Brand';
import { blip, formatTableSpeech, playStaffCallAlert } from '../lib/sound';
import { getAllItemRatings } from '../lib/reviews';

const REASONS: CallReason[] = ['Assistance', 'Water refill', 'Cutlery', 'Request bill', 'Cleaning'];


const getCategoryShortName = (name: string, id: string) => {
  if (id === 'all') return 'All';
  if (id === 'top-rated') return 'Top Rated';
  if (id === 'cat-snacks' || id === 'c-chicken-snacks') return 'Snacks';
  if (id === 'c-egg-lolly') return 'Egg Lolly';
  if (id === 'cat-milkshake' || id === 'c-lassi') return 'Lassi';
  const base = name.split(' (')[0].trim();
  if (base.toLowerCase() === 'snacks & bites') return 'Snacks';
  if (base.toLowerCase() === 'egg lolly pop') return 'Egg Lolly';
  return base;
};

const renderCategoryIcon = (c: Category, isActive: boolean) => {
  const iconProps = { size: 24, strokeWidth: 2.2 };
  if (isActive) {
    switch (c.id) {
      case 'c-coffee':
        return <Coffee {...iconProps} className="text-white" />;
      case 'c-tea':
        return <Leaf {...iconProps} className="text-white" />;
      case 'c-mocktails':
      case 'cat-milkshake':
      case 'c-lassi':
        return <CupSoda {...iconProps} className="text-white" />;
      case 'cat-snacks':
      case 'c-chicken-snacks':
        return <UtensilsCrossed {...iconProps} className="text-white" />;
      case 'c-starters':
        return <Flame {...iconProps} className="text-white" />;
      default:
        if (c.emoji) {
          return <span className="text-[22px] leading-none filter brightness-125">{c.emoji}</span>;
        }
        return <Utensils {...iconProps} className="text-white" />;
    }
  }

  switch (c.id) {
    case 'c-coffee':
      return <Coffee {...iconProps} className="text-[#8B5A2B]" />;
    case 'c-tea':
      return <Leaf {...iconProps} className="text-[#388E3C]" />;
    case 'c-mocktails':
    case 'cat-milkshake':
    case 'c-lassi':
      return <CupSoda {...iconProps} className="text-[#0284C7]" />;
    case 'cat-snacks':
    case 'c-chicken-snacks':
      return <span className="text-[22px] leading-none">🍟</span>;
    case 'c-starters':
      return <Flame {...iconProps} className="text-[#E11D48]" />;
    case 'cat-momos':
      return <span className="text-[22px] leading-none">🥟</span>;
    case 'c-rice':
      return <span className="text-[22px] leading-none">🍚</span>;
    case 'c-soups':
      return <Soup {...iconProps} className="text-[#D97706]" />;
    case 'c-noodles':
      return <span className="text-[22px] leading-none">🍜</span>;
    case 'c-shawarma':
      return <span className="text-[22px] leading-none">🌯</span>;
    case 'c-egg-lolly':
      return <span className="text-[22px] leading-none">🍳</span>;
    default:
      if (c.emoji) {
        return <span className="text-[22px] leading-none">{c.emoji}</span>;
      }
      return <Utensils {...iconProps} className="text-stone-700" />;
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
    case 'top-rated':
      return '⭐';
    default:
      return emoji || '🍽️';
  }
};

const getCategorySubtitle = (id: string) => {
  switch (id) {
    case 'top-rated':
      return 'Customer favorites ranked by highest verified ratings & satisfaction!';
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
  const [diningMode, setDiningMode] = useState<'Dine-in' | 'Takeaway'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ivan-dining-mode');
      if (saved === 'Takeaway' || saved === 'Dine-in') return saved;
    }
    return 'Dine-in';
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ivan-menu-view-mode');
      if (saved === 'list' || saved === 'grid') return saved;
    }
    return 'grid';
  });

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('ivan-menu-view-mode', mode);
    } catch {}
    blip();
  };

  const switchDiningMode = (mode: 'Dine-in' | 'Takeaway') => {
    setDiningMode(mode);
    try {
      localStorage.setItem('ivan-dining-mode', mode);
    } catch {}
    blip();
    if (mode === 'Takeaway') {
      toast('🛍️ Takeaway / Parcel mode selected — Pack & carry!', 'info');
    } else {
      toast(`🍽️ Dine-in mode selected — Serve at Table ${table.code}!`, 'info');
    }
  };

  const handleCallStaff = (selectedReason: CallReason = 'Assistance', note?: string) => {
    actions.callStaff(table.code, selectedReason, note);
    const spoken = formatTableSpeech(table.code);
    toast(`🔔 Staff alerted for ${spoken} (${selectedReason}) — someone is on the way!`, 'info');
  };

  const liveOrders = orders.filter(
    (o) => o.tableCode === table.code && o.status !== 'SERVED' && o.status !== 'CANCELLED',
  );

  const lines = useCart(table.code || 'T01');
  const cartCount = lines.reduce((s, l) => s + l.qty, 0);
  const cartTotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  const qtyOf = (id: string) =>
    lines.filter((l) => l.itemId === id).reduce((s, l) => s + l.qty, 0);

  const ratingsMap = useMemo(() => getAllItemRatings(items, orders), [items, orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = items.filter((i) => {
      const matchQ =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.tags.join(' ').toLowerCase().includes(q);
      const matchC = activeCat === 'all' || activeCat === 'top-rated' || i.categoryId === activeCat;
      return matchQ && matchC;
    });

    if (activeCat === 'top-rated') {
      return [...base].sort((a, b) => {
        const statsA = ratingsMap.get(a.id);
        const statsB = ratingsMap.get(b.id);
        const scoreA = (statsA?.averageRating || 0) * 100 + (statsA?.totalReviews || 0);
        const scoreB = (statsB?.averageRating || 0) * 100 + (statsB?.totalReviews || 0);
        return scoreB - scoreA;
      });
    }

    return base;
  }, [items, query, activeCat, ratingsMap]);

  // Group items by category
  const grouped = useMemo(() => {
    if (activeCat === 'top-rated') {
      return [
        {
          cat: {
            id: 'top-rated',
            name: '⭐ Most Loved & Top Rated Dishes',
            emoji: '⭐',
            sort: 0,
          },
          list: filtered,
        },
      ];
    }
    return categories
      .map((c) => ({ cat: c, list: filtered.filter((i) => i.categoryId === c.id) }))
      .filter((g) => g.list.length > 0);
  }, [categories, filtered, activeCat]);

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
      {/* ---------------------------------------------------- */}
      {/* 1. HERO HEADER AREA                                  */}
      {/* ---------------------------------------------------- */}
      <header className="relative bg-[#17110D] text-white pt-5 pb-10 px-4 sm:px-5 overflow-hidden">
        {/* Background ambient lighting and textures */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#3d281a_0%,#17110d_70%)] opacity-90 pointer-events-none" />
        <div className="absolute -top-16 -right-16 h-72 w-72 rounded-full bg-amber-600/15 blur-3xl pointer-events-none" />

        {/* Top bar: Hamburger, Clean Brand Center, Call Staff & Table selector Right */}
        <div className="relative z-10 flex items-center justify-between gap-2.5">
          {/* Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 hover:bg-white/20 text-white/95 backdrop-blur-md transition active:scale-95 cursor-pointer"
            aria-label="Open menu options"
          >
            <MenuIcon size={20} strokeWidth={2.2} />
          </button>

          {/* Center Brand Title - Clean, Elegant, Luxury Branding */}
          <div className="text-center min-w-0 flex-1 px-1">
            <h1 className="font-editorial text-[17px] sm:text-[19px] font-bold tracking-[0.18em] text-[#FFFDF9] uppercase drop-shadow-sm leading-tight truncate">
              IVAN FOOD COURT
            </h1>
            <p className="text-[8.5px] font-bold tracking-[0.24em] text-[#E5B869] uppercase mt-0.5 opacity-90">
              — GOOD FOOD · GOOD MOOD —
            </p>
          </div>

          {/* Right Action Area: Glowing Call Staff + Table Selector */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Call Staff Button: Compact, Glowing, Non-overlapping */}
            <button
              type="button"
              onClick={() => {
                handleCallStaff('Assistance');
                setCallOpen(true);
              }}
              className="h-10 px-2.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-amber-600/25 hover:from-amber-500/35 hover:to-amber-600/35 border border-amber-400/50 text-amber-300 flex items-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
              title="Call staff / waiter to your table"
            >
              <BellRing size={16} className="text-amber-300 fill-amber-300/30 animate-pulse shrink-0" />
              <span className="text-[11px] font-bold tracking-wide uppercase hidden xs:inline">Staff</span>
            </button>

            {/* Table Selection / Dining Mode Badge */}
            <button
              type="button"
              onClick={() => setTableModalOpen(true)}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 backdrop-blur-md transition active:scale-95 text-left shadow-sm border cursor-pointer ${
                diningMode === 'Takeaway'
                  ? 'bg-amber-600/30 hover:bg-amber-600/40 border-amber-400/40 text-amber-200'
                  : 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
              }`}
            >
              <div className="text-right">
                <p className="text-[11.5px] font-bold leading-none flex items-center gap-1">
                  {diningMode === 'Takeaway' ? '🛍️ Takeaway' : `🍽️ ${table.code}`}
                  <ChevronDown size={11} className="opacity-70" />
                </p>
                <p className="text-[8.5px] text-[#E5B869] font-bold uppercase tracking-wider mt-0.5">
                  {diningMode === 'Takeaway' ? 'Parcel' : 'Dine-in'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Hero Banner: Luxury Cinematic Coffee Scene */}
        <div className="relative z-10 mt-5 rounded-[26px] overflow-hidden shadow-2xl border border-white/10 bg-[#17110D]">
          <div
            className="relative w-full min-h-[175px] sm:min-h-[195px] bg-cover bg-right flex items-center px-5 sm:px-6 py-4"
            style={{ backgroundImage: `url('/brand/hero_coffee_banner.jpg')` }}
          >
            {/* Dark gradient overlay for ultra-crisp readable typography */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#17110D] via-[#17110D]/80 to-transparent sm:via-[#17110D]/65 pointer-events-none" />

            {/* Left Cursive Typography */}
            <div className="relative z-10 max-w-[210px] sm:max-w-[250px] space-y-1">
              <span className="text-[#E5B869] text-xs font-bold tracking-widest block opacity-90 select-none">✦ ✦</span>

              <h2 className="font-hand leading-[1.0] text-left">
                <span className="block text-[36px] sm:text-[42px] font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  Good Food
                </span>
                <span className="block text-[40px] sm:text-[46px] font-extrabold text-[#E5B869] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] -mt-1">
                  Good Mood
                </span>
              </h2>

              <span className="text-[#E5B869] text-xs font-bold tracking-widest block opacity-90 select-none">✦ ✦</span>

              <p className="text-[11px] sm:text-[12px] font-medium text-stone-200 pt-0.5 tracking-wide leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                Fresh food &bull; Great coffee &bull; Cozy vibes
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* 2. MAIN CURVED SHEET CONTAINER                       */}
      {/* ---------------------------------------------------- */}
      <div className="relative -mt-6 rounded-t-[34px] bg-[#FAF6F0] px-4 pt-4 pb-6 border-t border-[#EADECE]/80 shadow-2xl">
        {/* ---------------------------------------------------- */}
        {/* PROMINENT DINING MODE SWITCHER: DINE-IN vs TAKEAWAY  */}
        {/* ---------------------------------------------------- */}
        <div className="mb-3.5 overflow-hidden rounded-[24px] border border-[#E7DCCE] bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            {/* Dine-In Tab */}
            <button
              type="button"
              onClick={() => switchDiningMode('Dine-in')}
              className={`relative flex items-center justify-center gap-2 rounded-2xl py-3 px-3 transition-all cursor-pointer ${
                diningMode === 'Dine-in'
                  ? 'bg-gradient-to-br from-[#18392B] to-[#0F261D] text-white shadow-md shadow-emerald-950/20 ring-1 ring-emerald-700/50'
                  : 'bg-[#F9F6F0] text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/60'
              }`}
            >
              <div className={`grid h-8 w-8 place-items-center rounded-xl shrink-0 ${
                diningMode === 'Dine-in' ? 'bg-white/15 text-amber-300' : 'bg-white text-stone-500 shadow-2xs'
              }`}>
                <UtensilsCrossed size={16} strokeWidth={2.5} />
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13.5px] font-black leading-tight">Dine-in</span>
                  <span className={`rounded-full px-1.5 py-0.2 text-[9.5px] font-extrabold ${
                    diningMode === 'Dine-in' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {table.code}
                  </span>
                </div>
                <p className={`text-[10px] font-medium leading-none mt-0.5 truncate ${
                  diningMode === 'Dine-in' ? 'text-emerald-100/80' : 'text-stone-500'
                }`}>
                  Eat at table
                </p>
              </div>
            </button>

            {/* Takeaway Tab */}
            <button
              type="button"
              onClick={() => switchDiningMode('Takeaway')}
              className={`relative flex items-center justify-center gap-2 rounded-2xl py-3 px-3 transition-all cursor-pointer ${
                diningMode === 'Takeaway'
                  ? 'bg-gradient-to-br from-[#C2571F] to-[#9C3F10] text-white shadow-md shadow-orange-950/20 ring-1 ring-orange-600/50'
                  : 'bg-[#F9F6F0] text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/60'
              }`}
            >
              <div className={`grid h-8 w-8 place-items-center rounded-xl shrink-0 ${
                diningMode === 'Takeaway' ? 'bg-white/20 text-white' : 'bg-white text-stone-500 shadow-2xs'
              }`}>
                <ShoppingBag size={16} strokeWidth={2.5} />
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13.5px] font-black leading-tight">Takeaway</span>
                  <span className={`rounded-full px-1.5 py-0.2 text-[9.5px] font-extrabold ${
                    diningMode === 'Takeaway' ? 'bg-white/25 text-white' : 'bg-orange-100 text-orange-800'
                  }`}>
                    Parcel 🛍️
                  </span>
                </div>
                <p className={`text-[10px] font-medium leading-none mt-0.5 truncate ${
                  diningMode === 'Takeaway' ? 'text-amber-100/90' : 'text-stone-500'
                }`}>
                  Pack & carry
                </p>
              </div>
            </button>
          </div>

          {/* Context Helper Line */}
          <div className="mt-2 flex items-center justify-between border-t border-[#F0E6D8] pt-2 px-1 text-[11px]">
            {diningMode === 'Dine-in' ? (
              <>
                <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  Serving fresh at <strong className="text-emerald-950">Table {table.code}</strong> ({table.label || 'Main Hall'})
                </span>
                <button
                  type="button"
                  onClick={() => setTableModalOpen(true)}
                  className="rounded-lg bg-stone-100 hover:bg-stone-200 px-2 py-0.5 text-[10.5px] font-bold text-stone-700 transition"
                >
                  Change Table
                </button>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 text-orange-800 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-orange-600 animate-pulse" />
                  <strong className="text-orange-950">Takeaway / Parcel</strong> · Packed fresh to take home or office
                </span>
                <span className="rounded-lg bg-orange-100 px-2 py-0.5 text-[10.5px] font-extrabold text-orange-900">
                  Counter Collect
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quick Top Call Staff Bar - Extra Large & Prominent */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => {
              handleCallStaff('Assistance');
              setCallOpen(true);
            }}
            className="w-full flex items-center justify-between rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border-2 border-amber-500/40 p-3 text-amber-950 shadow-sm transition active:scale-[0.98] cursor-pointer"
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
        {/* 3. CATEGORY GRID (SQUIRCLE CARDS - NO HORIZONTAL SCROLL) */}
        {/* ---------------------------------------------------- */}
        <div className="mt-4 grid grid-cols-4 gap-2.5">
          {/* ALL Category Card */}
          <button
            type="button"
            onClick={() => setActiveCat('all')}
            className={`group relative flex flex-col items-center justify-center rounded-[22px] p-2 h-[82px] w-full transition-all duration-200 active:scale-95 cursor-pointer ${
              activeCat === 'all'
                ? 'bg-[#123826] text-white shadow-md shadow-[#123826]/25 ring-1 ring-[#123826]'
                : 'bg-white text-stone-800 border border-[#EDE8DF] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:bg-[#FAF8F5] hover:border-stone-300 hover:shadow-sm'
            }`}
          >
            <div className="flex h-9 w-9 items-center justify-center transition-transform group-hover:scale-110">
              <Coffee
                size={24}
                strokeWidth={2.2}
                className={activeCat === 'all' ? 'text-white' : 'text-[#123826]'}
              />
            </div>
            <span
              className={`mt-1 text-[11.5px] font-bold text-center leading-tight tracking-tight line-clamp-1 ${
                activeCat === 'all' ? 'text-white font-extrabold' : 'text-stone-800'
              }`}
            >
              All
            </span>
          </button>

          {/* Top Rated Category Card */}
          <button
            type="button"
            onClick={() => setActiveCat('top-rated')}
            className={`group relative flex flex-col items-center justify-center rounded-[22px] p-2 h-[82px] w-full transition-all duration-200 active:scale-95 cursor-pointer ${
              activeCat === 'top-rated'
                ? 'bg-[#123826] text-white shadow-md shadow-[#123826]/25 ring-1 ring-[#123826]'
                : 'bg-white text-stone-800 border border-[#EDE8DF] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:bg-[#FAF8F5] hover:border-stone-300 hover:shadow-sm'
            }`}
          >
            <div className="flex h-9 w-9 items-center justify-center transition-transform group-hover:scale-110">
              <Sparkles
                size={24}
                strokeWidth={2.2}
                className={activeCat === 'top-rated' ? 'text-white' : 'text-amber-500'}
              />
            </div>
            <span
              className={`mt-1 text-[11.5px] font-bold text-center leading-tight tracking-tight line-clamp-1 ${
                activeCat === 'top-rated' ? 'text-white font-extrabold' : 'text-stone-800'
              }`}
            >
              Top Rated
            </span>
          </button>

          {/* Dynamic Category Cards */}
          {categories.map((c) => {
            const isActive = activeCat === c.id;
            const displayName = getCategoryShortName(c.name, c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCat(c.id)}
                className={`group relative flex flex-col items-center justify-center rounded-[22px] p-2 h-[82px] w-full transition-all duration-200 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-[#123826] text-white shadow-md shadow-[#123826]/25 ring-1 ring-[#123826]'
                    : 'bg-white text-stone-800 border border-[#EDE8DF] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:bg-[#FAF8F5] hover:border-stone-300 hover:shadow-sm'
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center transition-transform group-hover:scale-110">
                  {renderCategoryIcon(c, isActive)}
                </div>
                <span
                  className={`mt-1 text-[11.5px] font-bold text-center leading-tight tracking-tight line-clamp-1 ${
                    isActive ? 'text-white font-extrabold' : 'text-stone-800'
                  }`}
                >
                  {displayName}
                </span>
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

          {grouped.length > 0 && (
            <div className="flex items-center justify-between pt-1 pb-1">
              <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-stone-500">
                {filtered.length} Dishes
              </span>
              <div className="flex items-center rounded-2xl bg-[#EBE4D8] p-1 border border-[#DCD3C4] shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleSetViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  aria-label="Side by side view"
                >
                  <LayoutGrid size={13} strokeWidth={2.5} />
                  <span>Side by Side</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  aria-label="List view"
                >
                  <Rows3 size={13} strokeWidth={2.5} />
                  <span>List</span>
                </button>
              </div>
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

                {/* Items List / Grid */}
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-2.5 sm:gap-3.5' : 'space-y-3'}>
                  {list.map((item, idx) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      index={idx}
                      layout={viewMode}
                      inCart={qtyOf(item.id)}
                      onOpen={() => setSheetItem(item)}
                      onDirectAdd={(qty) => handleDirectAdd(item, qty)}
                      onDirectRemove={() => handleDirectRemove(item)}
                      ratingStats={ratingsMap.get(item.id)}
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
        ratingStats={sheetItem ? ratingsMap.get(sheetItem.id) : undefined}
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
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  switchDiningMode('Dine-in');
                  setTableModalOpen(false);
                }}
                className={`rounded-2xl py-3 px-4 text-sm font-bold border transition flex flex-col items-center gap-1 ${
                  diningMode === 'Dine-in'
                    ? 'bg-[#18392B] text-white border-[#18392B] shadow-md'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                }`}
              >
                <span className="text-xl">🍽️</span>
                <span>Dine-in</span>
                <span className="text-[10px] opacity-80">Eat at Table</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  switchDiningMode('Takeaway');
                  setTableModalOpen(false);
                }}
                className={`rounded-2xl py-3 px-4 text-sm font-bold border transition flex flex-col items-center gap-1 ${
                  diningMode === 'Takeaway'
                    ? 'bg-[#C2571F] text-white border-[#C2571F] shadow-md'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                }`}
              >
                <span className="text-xl">🛍️</span>
                <span>Takeaway</span>
                <span className="text-[10px] opacity-80">Parcel / Pack to go</span>
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
                  <div className="mt-3 flex gap-2">
                    <Link
                      to={`/order/${o.code}`}
                      onClick={() => setOrdersSheetOpen(false)}
                      className="flex-1 block text-center rounded-xl bg-[#18392B] py-2 text-xs font-bold text-white transition hover:bg-[#122A20]"
                    >
                      Track Order →
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Cancel order #${o.code}? The kitchen will stop cooking.`)) {
                          actions.setOrderStatus(o.id, 'CANCELLED', 'Customer');
                          toast(`Order #${o.code} has been cancelled`, 'info');
                        }
                      }}
                      className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
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
                handleCallStaff('Assistance');
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

            <a
              href="https://maps.app.goo.gl/FWKo4hBFPVtqYvph9?g_st=ic"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-between rounded-xl bg-white border border-stone-200 p-3.5 font-bold text-stone-800 transition hover:bg-stone-50"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">⭐</span>
                <span>Give Feedback on Google</span>
              </div>
              <ChevronRight size={16} className="text-stone-400" />
            </a>

            <a
              href="https://www.facebook.com/share/1Dhjd93nm1/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-between rounded-xl bg-white border border-stone-200 p-3.5 font-bold text-stone-800 transition hover:bg-stone-50"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">📢</span>
                <span>Visit Our Facebook Channel</span>
              </div>
              <ChevronRight size={16} className="text-stone-400" />
            </a>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-600" />
              <p className="text-sm font-bold">Fast WiFi in Cafe</p>
            </div>
            <p className="mt-1 text-xs text-stone-500">Scan QR on your table or connect to:</p>
            <div className="mt-3 rounded-xl bg-stone-100 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500">Network</span>
                <span className="text-xs font-mono font-bold text-emerald-800">Connected</span>
              </div>
              <p className="mt-1 font-bold text-sm">Ivan-Guest-5G</p>
              <p className="text-xs text-stone-500">Password: coffeeandchill</p>
            </div>
          </div>
        </div>
      </Sheet>

      {/* Staff Call Sheet */}
      <Sheet open={callOpen} onClose={() => setCallOpen(false)} title="Call Our Staff">
        <div className="space-y-4 px-5 py-5">
          <div className="flex items-center gap-3 rounded-2xl bg-amber-500/15 p-3.5 border border-amber-500/30">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500 text-stone-950 shrink-0 shadow-md shadow-amber-500/30">
              <BellRing size={20} className="animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-black text-stone-900">
                Calling staff for <span className="text-amber-900 underline font-black">{formatTableSpeech(table.code)}</span>
              </p>
              <p className="text-xs text-stone-600">
                Ringtone and voice alert has been sent to our staff.
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Need something specific?</p>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <Chip key={r} active={reason === r} onClick={() => setReason(r)}>
                  {r}
                </Chip>
              ))}
            </div>
          </div>

          <textarea
            rows={2}
            value={callNote}
            onChange={(e) => setCallNote(e.target.value.slice(0, 120))}
            placeholder="Anything specific? (optional, e.g. extra napkins or cutlery)"
            className="w-full resize-none rounded-2xl border border-stone-300 bg-white px-4 py-3 text-[14px] outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10"
          />
          <Button
            full
            size="lg"
            onClick={() => {
              handleCallStaff(reason, callNote.trim() || undefined);
              setCallOpen(false);
              setCallNote('');
            }}
            className="shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <BellRing size={18} className="animate-pulse" /> Ring Staff Again ({formatTableSpeech(table.code)})
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
