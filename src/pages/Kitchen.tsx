import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  BellRing,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  Clock,
  ConciergeBell,
  Flame,
  MoreVertical,
  Printer,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  X,
  XCircle,
} from 'lucide-react';
import { actions, useCalls, useItems, useOrders } from '../lib/store';
import type { CartLine, MenuItem, Order, OrderStatus } from '../lib/types';
import { chime, formatTableSpeech, playStaffCallAlert } from '../lib/sound';

export interface KitchenTicketItem {
  id: string;
  name: string;
  qty: number;
  details?: string;
  image: string;
}

export interface KitchenTicket {
  id: string;
  code: string;
  tableCode: string;
  time: string;
  status: 'PREPARING' | 'READY' | 'SERVED';
  diningMode?: 'Dine-in' | 'Takeaway';
  items: KitchenTicketItem[];
  isRealOrder?: boolean;
  orderId?: string;
}

/**
 * Intelligent image resolver: ensures that EVERY ordered food item ALWAYS has
 * its high-definition photo displayed on the kitchen ticket card.
 */
function resolveItemImage(name: string, lineImage?: string, items?: MenuItem[]): string {
  if (lineImage && lineImage.trim() !== '' && lineImage !== '/menu/burger.jpg') {
    return lineImage;
  }
  const cleanName = (name || '').trim().toLowerCase();

  // 1. Search in live menu items
  if (items && items.length > 0) {
    const matched = items.find(
      (i) =>
        i.name.toLowerCase() === cleanName ||
        cleanName.includes(i.name.toLowerCase()) ||
        i.name.toLowerCase().includes(cleanName)
    );
    if (matched && matched.image) return matched.image;
  }

  // 2. Exact dish keyword matching with menu assets
  if (cleanName.includes('pizza')) return '/menu/veg_pizza.jpg';
  if (cleanName.includes('noodle') || cleanName.includes('hakka') || cleanName.includes('chow')) {
    return '/menu/hakka_noodles_hd.jpg';
  }
  if (cleanName.includes('fried rice') || cleanName.includes('garlic rice') || cleanName.includes('rice')) {
    return '/menu/burnt_garlic_rice_hd.jpg';
  }
  if (cleanName.includes('burger')) return '/menu/burger.jpg';
  if (cleanName.includes('pasta')) return '/menu/pasta.jpg';
  if (cleanName.includes('fries') || cleanName.includes('french fry')) return '/menu/fries.jpg';
  if (cleanName.includes('manchurian')) return '/menu/veg_manchurian_hd.jpg';
  if (cleanName.includes('sizzler')) return '/menu/chinese_sizzler_hd.jpg';
  if (cleanName.includes('spring roll') || cleanName.includes('roll')) return '/menu/spring_roll.jpg';
  if (cleanName.includes('cappuccino') || cleanName.includes('coffee') || cleanName.includes('latte')) {
    return '/menu/cappuccino.jpg';
  }
  if (cleanName.includes('tea') || cleanName.includes('cha')) return '/menu/malai_cha_hd.jpg';
  if (cleanName.includes('smoothie') || cleanName.includes('mango')) return '/menu/mango.jpg';
  if (cleanName.includes('lassi')) return '/menu/blue_curacao_lassi_hd.jpg';
  if (cleanName.includes('popcorn') || cleanName.includes('snack') || cleanName.includes('ball')) {
    return '/menu/chicken_popcorn_hd.jpg';
  }
  if (cleanName.includes('chilli chicken') || cleanName.includes('chicken 65') || cleanName.includes('pepper dry')) {
    return '/menu/chilli_chicken_hd.jpg';
  }
  if (cleanName.includes('soup')) return '/menu/manchow_soup_hd.jpg';
  if (cleanName.includes('shawarma')) return '/menu/shawarma_roll_hd.jpg';
  if (cleanName.includes('lolly') || cleanName.includes('egg')) return '/menu/egg_lolly_hd.jpg';

  return lineImage || '/menu/burger.jpg';
}

// Initial seed tickets matching user's exact reference screenshot
const INITIAL_SEED_TICKETS: KitchenTicket[] = [
  // 1. Cooking Now (5 items)
  {
    id: 'kds-1026',
    code: 'IV-1026',
    tableCode: 'T02',
    time: '11:42 AM',
    status: 'PREPARING',
    diningMode: 'Dine-in',
    items: [
      {
        id: 'ki-1',
        name: 'Chinese Noodles',
        qty: 2,
        details: 'Chicken + Extra Spicy',
        image: '/menu/hakka_noodles_hd.jpg',
      },
    ],
  },
  {
    id: 'kds-1027',
    code: 'IV-1027',
    tableCode: 'T05',
    time: '11:48 AM',
    status: 'PREPARING',
    diningMode: 'Dine-in',
    items: [
      {
        id: 'ki-2',
        name: 'Chicken Fried Rice',
        qty: 1,
        details: 'Regular | No Egg',
        image: '/menu/burnt_garlic_rice_hd.jpg',
      },
    ],
  },
  {
    id: 'kds-1028',
    code: 'IV-1028',
    tableCode: 'T03',
    time: '11:52 AM',
    status: 'PREPARING',
    diningMode: 'Dine-in',
    items: [
      {
        id: 'ki-3',
        name: 'Chicken Burger',
        qty: 1,
        details: 'With Cheese | No Onion',
        image: '/menu/burger.jpg',
      },
    ],
  },
  {
    id: 'kds-1030',
    code: 'IV-1030',
    tableCode: 'T06',
    time: '12:03 PM',
    status: 'PREPARING',
    diningMode: 'Dine-in',
    items: [
      {
        id: 'ki-4',
        name: 'Creamy Pasta',
        qty: 1,
        details: 'Alfredo Sauce | Extra Cheese',
        image: '/menu/pasta.jpg',
      },
    ],
  },
  {
    id: 'kds-1031',
    code: 'IV-1031',
    tableCode: 'T01',
    time: '12:08 PM',
    status: 'PREPARING',
    diningMode: 'Dine-in',
    items: [
      {
        id: 'ki-5',
        name: 'Veg Pizza',
        qty: 1,
        details: 'Thin Crust | Extra Cheese',
        image: '/menu/veg_pizza.jpg',
      },
    ],
  },

  // 2. Ready to Serve / Collect (4 items)
  {
    id: 'kds-1023',
    code: 'IV-1023',
    tableCode: 'T04',
    time: '11:35 AM',
    status: 'READY',
    diningMode: 'Dine-in',
    items: [
      {
        id: 'ki-6',
        name: 'Beef Burger',
        qty: 1,
        details: 'Classic | No Onion',
        image: '/menu/burger.jpg',
      },
    ],
  },
  {
    id: 'kds-1024',
    code: 'IV-1024',
    tableCode: 'T07',
    time: '11:47 AM',
    status: 'READY',
    diningMode: 'Dine-in',
    items: [
      {
        id: 'ki-7',
        name: 'French Fries',
        qty: 2,
        details: 'Regular',
        image: '/menu/fries.jpg',
      },
    ],
  },
  {
    id: 'kds-1025',
    code: 'IV-1025',
    tableCode: 'T08',
    time: '11:56 AM',
    status: 'READY',
    diningMode: 'Dine-in',
    items: [
      {
        id: 'ki-8',
        name: 'Iced Coffee',
        qty: 1,
        details: 'Medium | Less Sugar',
        image: '/menu/cold_coffee_special.jpg',
      },
    ],
  },
  {
    id: 'kds-1029',
    code: 'IV-1029',
    tableCode: 'T02',
    time: '12:01 PM',
    status: 'READY',
    diningMode: 'Dine-in',
    items: [
      {
        id: 'ki-9',
        name: 'Mango Smoothie',
        qty: 1,
        details: 'Regular',
        image: '/menu/mango.jpg',
      },
    ],
  },

  // 3. Served (12 items total, exactly matching screenshot)
  {
    id: 'kds-1015',
    code: 'IV-1015',
    tableCode: 'T01',
    time: '11:20 AM',
    status: 'SERVED',
    diningMode: 'Dine-in',
    items: [
      {
        id: 'ki-10',
        name: 'Veg Manchurian Dry',
        qty: 1,
        details: 'Mild (কাঁচা লঙ্কা)',
        image: '/menu/veg_manchurian_hd.jpg',
      },
    ],
  },
  {
    id: 'kds-1018',
    code: 'IV-1018',
    tableCode: 'T01',
    time: '11:28 AM',
    status: 'SERVED',
    diningMode: 'Dine-in',
    items: [
      {
        id: 'ki-11',
        name: 'Chinese Sizzler',
        qty: 1,
        details: 'Spicy Hot (ঝাল)',
        image: '/menu/chinese_sizzler_hd.jpg',
      },
    ],
  },
  {
    id: 'kds-1019',
    code: 'IV-1019',
    tableCode: 'T02',
    time: '11:36 AM',
    status: 'SERVED',
    diningMode: 'Dine-in',
    items: [
      {
        id: 'ki-12',
        name: 'Spring Roll',
        qty: 1,
        details: 'Chicken',
        image: '/menu/spring_roll.jpg',
      },
    ],
  },
  {
    id: 'kds-1020',
    code: 'IV-1020',
    tableCode: 'T03',
    time: '11:45 AM',
    status: 'SERVED',
    diningMode: 'Dine-in',
    items: [
      {
        id: 'ki-13',
        name: 'Cappuccino',
        qty: 1,
        details: 'Hot | Regular',
        image: '/menu/cappuccino.jpg',
      },
    ],
  },
  {
    id: 'kds-1021',
    code: 'IV-1021',
    tableCode: 'T04',
    time: '11:52 AM',
    status: 'SERVED',
    diningMode: 'Dine-in',
    items: [
      {
        id: 'ki-14',
        name: 'Lemon Iced Tea',
        qty: 1,
        details: 'Regular',
        image: '/menu/peachtea.jpg',
      },
    ],
  },
  // Additional historical served items to match the count 12 badge
  {
    id: 'kds-1010',
    code: 'IV-1010',
    tableCode: 'T02',
    time: '10:55 AM',
    status: 'SERVED',
    diningMode: 'Dine-in',
    items: [{ id: 'ki-15', name: 'Malai Cha', qty: 2, details: 'Regular', image: '/menu/malai_cha_hd.jpg' }],
  },
  {
    id: 'kds-1011',
    code: 'IV-1011',
    tableCode: 'T05',
    time: '11:02 AM',
    status: 'SERVED',
    diningMode: 'Dine-in',
    items: [{ id: 'ki-16', name: 'Chicken Popcorn', qty: 1, details: 'Crispy', image: '/menu/chicken_popcorn_hd.jpg' }],
  },
  {
    id: 'kds-1012',
    code: 'IV-1012',
    tableCode: 'T03',
    time: '11:08 AM',
    status: 'SERVED',
    diningMode: 'Dine-in',
    items: [{ id: 'ki-17', name: 'Chicken Shawarma Roll', qty: 1, details: 'Extra Mayo', image: '/menu/shawarma_roll_hd.jpg' }],
  },
  {
    id: 'kds-1013',
    code: 'IV-1013',
    tableCode: 'T06',
    time: '11:12 AM',
    status: 'SERVED',
    diningMode: 'Dine-in',
    items: [{ id: 'ki-18', name: 'Blue Curacao Lassi', qty: 1, details: 'Nuts', image: '/menu/blue_curacao_lassi_hd.jpg' }],
  },
  {
    id: 'kds-1014',
    code: 'IV-1014',
    tableCode: 'T01',
    time: '11:15 AM',
    status: 'SERVED',
    diningMode: 'Dine-in',
    items: [{ id: 'ki-19', name: 'Dry Chilli Chicken', qty: 1, details: 'Medium', image: '/menu/chilli_chicken_hd.jpg' }],
  },
  {
    id: 'kds-1016',
    code: 'IV-1016',
    tableCode: 'T04',
    time: '11:22 AM',
    status: 'SERVED',
    diningMode: 'Dine-in',
    items: [{ id: 'ki-20', name: 'Manchow Soup', qty: 1, details: 'Crispy Noodles', image: '/menu/manchow_soup_hd.jpg' }],
  },
  {
    id: 'kds-1017',
    code: 'IV-1017',
    tableCode: 'T05',
    time: '11:25 AM',
    status: 'SERVED',
    diningMode: 'Dine-in',
    items: [{ id: 'ki-21', name: 'Egg Lolly Pop', qty: 2, details: 'Spiced', image: '/menu/egg_lolly_hd.jpg' }],
  },
];

export default function KitchenPage() {
  const liveOrders = useOrders();
  const menuItems = useItems();
  const calls = useCalls();

  // Persistent ticket state seeded with the exact UI reference data
  const [tickets, setTickets] = useState<KitchenTicket[]>(() => {
    try {
      const saved = localStorage.getItem('kds_exact_tickets_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_SEED_TICKETS;
  });

  const [selectedTable, setSelectedTable] = useState<string>('ALL');

  const [sound, setSound] = useState(() => {
    const saved = localStorage.getItem('kitchen_sound');
    return saved !== null ? saved === 'true' : true;
  });

  const [flash, setFlash] = useState<string | null>(null);
  const [callAlert, setCallAlert] = useState<{ tableCode: string; reason: string } | null>(null);
  const [cancelAlert, setCancelAlert] = useState<{ code: string; tableCode: string; by?: string } | null>(null);
  const [activeMenuTicket, setActiveMenuTicket] = useState<string | null>(null);

  const seen = useRef<Set<string>>(new Set(liveOrders.map((o) => o.id)));
  const seenCalls = useRef<Set<string>>(new Set(calls.map((c) => c.id)));
  const seenCancelled = useRef<Set<string>>(new Set(liveOrders.filter((o) => o.status === 'CANCELLED').map((o) => o.id)));

  // Persist tickets
  useEffect(() => {
    try {
      localStorage.setItem('kds_exact_tickets_v2', JSON.stringify(tickets));
    } catch {}
  }, [tickets]);

  // Live clock
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }, [currentTime]);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [currentTime]);

  // Merge live incoming customer orders into tickets with GUARANTEED pictures!
  useEffect(() => {
    const fresh = liveOrders.filter((o) => !seen.current.has(o.id));
    if (fresh.length) {
      fresh.forEach((o) => seen.current.add(o.id));
      const newest = fresh[0];
      setFlash(newest.code);
      if (sound) chime();
      const t = setTimeout(() => setFlash(null), 4000);

      // Convert real order to tickets with guaranteed food pictures
      const newTickets: KitchenTicket[] = fresh.map((o) => ({
        id: `real-${o.id}`,
        code: `IV-${o.code}`,
        tableCode: o.tableCode,
        time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        status: o.status === 'READY' ? 'READY' : o.status === 'SERVED' ? 'SERVED' : 'PREPARING',
        diningMode: o.diningMode || 'Dine-in',
        items: o.lines.map((l) => ({
          id: l.lineId,
          name: l.name,
          qty: l.qty,
          details: l.addons?.map((a) => a.optionName).join(' · ') || (l.note ? l.note : 'Standard'),
          image: resolveItemImage(l.name, l.image, menuItems),
        })),
        isRealOrder: true,
        orderId: o.id,
      }));

      setTickets((prev) => [...newTickets, ...prev]);
      return () => clearTimeout(t);
    }
  }, [liveOrders, menuItems, sound]);

  // Cancelled alert
  useEffect(() => {
    const freshCancelled = liveOrders.filter((o) => o.status === 'CANCELLED' && !seenCancelled.current.has(o.id));
    if (freshCancelled.length) {
      freshCancelled.forEach((o) => seenCancelled.current.add(o.id));
      const newest = freshCancelled[0];
      const by = newest.timeline.slice().reverse().find((t) => t.status === 'CANCELLED')?.by;
      setCancelAlert({ code: newest.code, tableCode: newest.tableCode, by });
      if (sound) chime();
      const t = setTimeout(() => setCancelAlert(null), 7000);
      return () => clearTimeout(t);
    }
  }, [liveOrders, sound]);

  // Table call staff alerts
  useEffect(() => {
    const freshCalls = calls.filter((c) => !c.resolved && !seenCalls.current.has(c.id));
    if (freshCalls.length) {
      freshCalls.forEach((c) => seenCalls.current.add(c.id));
      const newest = freshCalls[0];
      setCallAlert({ tableCode: newest.tableCode, reason: newest.reason });
      if (sound) playStaffCallAlert(newest.tableCode);
      const t = setTimeout(() => setCallAlert(null), 6000);
      return () => clearTimeout(t);
    }
  }, [calls, sound]);

  const toggleSound = () => {
    setSound((s) => {
      const next = !s;
      localStorage.setItem('kitchen_sound', String(next));
      if (next) chime();
      return next;
    });
  };

  // Status transitions
  const handleMarkReady = (ticketId: string) => {
    if (sound) chime();
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          if (t.isRealOrder && t.orderId) {
            actions.setOrderStatus(t.orderId, 'READY', 'Kitchen');
          }
          return { ...t, status: 'READY' };
        }
        return t;
      })
    );
  };

  const handleServe = (ticketId: string) => {
    if (sound) chime();
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          if (t.isRealOrder && t.orderId) {
            actions.setOrderStatus(t.orderId, 'SERVED', 'Kitchen');
          }
          return { ...t, status: 'SERVED' };
        }
        return t;
      })
    );
  };

  const handleRemoveTicket = (ticketId: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    setActiveMenuTicket(null);
  };

  // Filtered lists
  const filteredTickets = useMemo(() => {
    if (selectedTable === 'ALL') return tickets;
    return tickets.filter((t) => t.tableCode.toUpperCase() === selectedTable.toUpperCase());
  }, [tickets, selectedTable]);

  const cookingTickets = useMemo(
    () => filteredTickets.filter((t) => t.status === 'PREPARING'),
    [filteredTickets]
  );
  const readyTickets = useMemo(
    () => filteredTickets.filter((t) => t.status === 'READY'),
    [filteredTickets]
  );
  const servedTickets = useMemo(
    () => filteredTickets.filter((t) => t.status === 'SERVED'),
    [filteredTickets]
  );

  const tables = [
    { code: 'ALL', label: `All (${tickets.length})` },
    { code: 'T01', label: 'T01 - Table 1' },
    { code: 'T02', label: 'T02 - Table 2' },
    { code: 'T03', label: 'T03 - Table 3' },
    { code: 'T04', label: 'T04 - Table 4' },
    { code: 'T05', label: 'T05 - Table 5' },
    { code: 'T06', label: 'T06 - Table 6' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F3F6F6] text-slate-800 antialiased font-sans select-none overflow-x-hidden">
      {/* -------------------- LEFT SIDEBAR -------------------- */}
      <aside className="w-56 shrink-0 bg-[#0F1416] flex flex-col justify-between border-r border-[#1B2326] min-h-screen sticky top-0 z-40">
        <div className="p-4 pt-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="text-[#E5B869] shrink-0">
              <svg width="34" height="34" viewBox="0 0 40 36" fill="none">
                <path
                  d="M7 18C4 18 2 15.5 2 12.5C2 9.5 4.5 7 7.5 7C7.8 7 8.2 7.05 8.5 7.15C9.6 3.2 13.2 0.5 17.5 0.5C20.2 0.5 22.6 1.6 24.3 3.4C25.7 1.6 28 0.5 30.5 0.5C34.6 0.5 38 3.9 38 8C38 8.4 37.95 8.8 37.85 9.2C39.2 10.4 40 12.1 40 14C40 17.3 37.3 20 34 20H6"
                  stroke="#E5B869"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 25H33M9 30H31M8.5 20L9.5 31H30.5L31.5 20"
                  stroke="#E5B869"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="font-serif text-[17px] font-black tracking-[0.2em] text-[#E5B869] leading-tight">
                IVAN
              </h1>
              <p className="text-[9px] font-bold tracking-[0.22em] text-[#D8A758] uppercase">
                FOOD COURT
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {/* Kitchen Display (Active) */}
            <Link
              to="/kitchen"
              className="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl bg-[#3E3023] text-white text-[13px] font-medium shadow-sm transition"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#E5B869]"
              >
                <path d="M12 4V2" />
                <path d="M4 14a8 8 0 0 1 16 0H4Z" />
                <path d="M2 18h20a1 1 0 0 0 1-1v-1H1v1a1 1 0 0 0 1 1Z" />
              </svg>
              <span>Kitchen Display</span>
            </Link>

            {/* Orders */}
            <Link
              to="/admin"
              className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 text-[13px] font-medium transition"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M9 12h6M9 16h6" />
              </svg>
              <span>Orders</span>
            </Link>

            {/* Menu */}
            <Link
              to="/menu"
              className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 text-[13px] font-medium transition"
            >
              <UtensilsCrossed size={17} />
              <span>Menu</span>
            </Link>

            {/* Settings */}
            <Link
              to="/admin"
              className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 text-[13px] font-medium transition"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Settings</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Graphic Artwork */}
        <div className="p-4 pb-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-15 pointer-events-none flex items-end justify-center">
            <svg width="180" height="110" viewBox="0 0 200 120" fill="none">
              <path
                d="M10 110C30 80 70 85 90 110M100 120C120 70 170 80 190 115M50 110C65 50 110 60 130 110"
                stroke="#E5B869"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="text-[#E5B869] mb-2 opacity-95">
              <svg width="44" height="42" viewBox="0 0 50 48" fill="none">
                <path
                  d="M18 16C16 16 14.5 14.5 14.5 12.5C14.5 10.5 16 9 18 9C18.2 9 18.5 9.05 18.7 9.1C19.5 6.5 22 4.5 25 4.5C28 4.5 30.5 6.5 31.3 9.1C31.5 9.05 31.8 9 32 9C34 9 35.5 10.5 35.5 12.5C35.5 14.5 34 16 32 16H18Z"
                  stroke="#E5B869"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M19 16V19H31V16" stroke="#E5B869" strokeWidth="1.8" />
                <path
                  d="M14 22H36V28C36 33 31 36 25 36C19 36 14 33 14 28V22Z"
                  stroke="#E5B869"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M36 24H39C40.5 24 41.5 25 41.5 26.5C41.5 28 40.5 29 39 29H35.5"
                  stroke="#E5B869"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path d="M10 39H40" stroke="#E5B869" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            <p className="font-hand text-[27px] font-bold text-[#E5B869] leading-[1.08] tracking-wide">
              Good Food
              <br />
              Good Mood <span className="text-[14px] inline-block -rotate-12 not-italic ml-0.5">✦</span>
            </p>
          </div>
        </div>
      </aside>

      {/* -------------------- MAIN CONTENT AREA -------------------- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/80 px-7 py-3 sticky top-0 z-30 flex items-center justify-between">
          {/* Left Title */}
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-full bg-[#FFF1EB] flex items-center justify-center text-[#E05A2B] shrink-0 shadow-2xs">
              <ChefHat size={22} className="text-[#E05A2B]" />
            </div>
            <div>
              <h1 className="text-[19px] font-extrabold text-slate-900 tracking-tight leading-tight">
                Kitchen Display (KDS)
              </h1>
              <p className="text-[11.5px] font-semibold text-slate-500 flex items-center gap-1.5">
                <span>Real-time orders</span>
                <span className="text-slate-300">•</span>
                <span>Faster service</span>
                <span className="text-slate-300">•</span>
                <span>Happier customers</span>
              </p>
            </div>
          </div>

          {/* Right Status Badges & Profile */}
          <div className="flex items-center gap-3">
            {/* Kitchen Online Badge */}
            <div className="bg-[#F8FAFC] border border-slate-200/90 rounded-2xl px-3.5 py-1.5 flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-[11.5px] font-extrabold text-slate-800 leading-tight">Kitchen Online</p>
                <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1 leading-tight">
                  <span className="inline-block">⏱</span> Real-time updates
                </p>
              </div>
            </div>

            {/* Time & Date Badge */}
            <div className="bg-[#F8FAFC] border border-slate-200/90 rounded-2xl px-3.5 py-1.5 flex items-center gap-2.5">
              <Clock size={15} className="text-slate-600 shrink-0" />
              <div>
                <p className="text-[11.5px] font-extrabold text-slate-800 leading-tight tabular-nums">
                  {formattedTime}
                </p>
                <p className="text-[10px] font-medium text-slate-400 leading-tight">
                  {formattedDate}
                </p>
              </div>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => {
                if (sound) chime();
              }}
              className="h-10 w-10 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 flex items-center justify-center relative text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#EF4444] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                3
              </span>
            </button>

            {/* Kitchen Staff Profile */}
            <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-2xl hover:bg-slate-100/70 transition cursor-pointer">
              <div className="h-9 w-9 rounded-full bg-[#111827] text-white flex items-center justify-center shadow-2xs">
                <ChefHat size={17} className="text-white" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[12px] font-bold text-slate-800 leading-tight">Kitchen Staff</p>
                <p className="text-[10px] font-medium text-slate-400 leading-tight">Kitchen</p>
              </div>
              <ChevronDown size={14} className="text-slate-400 ml-0.5" />
            </div>
          </div>
        </header>

        {/* -------------------- FILTER BAR & SOUND -------------------- */}
        <div className="px-7 py-3 flex items-center justify-between gap-4 border-b border-slate-200/60 bg-[#F3F6F6]">
          {/* Table Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {tables.map((tbl) => {
              const active = selectedTable.toUpperCase() === tbl.code.toUpperCase();
              return (
                <button
                  key={tbl.code}
                  onClick={() => setSelectedTable(tbl.code)}
                  className={`px-4 py-2 rounded-xl text-[12px] font-bold whitespace-nowrap transition cursor-pointer shadow-2xs ${
                    active
                      ? 'bg-[#B86927] text-white shadow-xs'
                      : 'bg-[#EAEFF2] text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  {tbl.label}
                </button>
              );
            })}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="flex items-center gap-2 bg-[#111827] hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-[12px] font-bold transition shadow-xs cursor-pointer shrink-0"
            title={sound ? 'Sound Alert is On' : 'Sound Alert is Muted'}
          >
            {sound ? (
              <>
                <Volume2 size={15} />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Sound On</span>
              </>
            ) : (
              <>
                <VolumeX size={15} className="text-slate-400" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                <span className="text-slate-300">Sound Off</span>
              </>
            )}
          </button>
        </div>

        {/* Floating Notifications */}
        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 text-[14px] font-extrabold shadow-2xl border-2 border-amber-300"
            >
              🔔 New order #{flash} just arrived!
            </motion.div>
          )}

          {callAlert && (
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              className="fixed left-1/2 top-20 z-50 -translate-x-1/2 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-6 py-3.5 text-stone-950 shadow-2xl border-2 border-amber-300 font-black animate-pulse"
            >
              <BellRing size={24} className="animate-bounce shrink-0 text-stone-950" />
              <div className="text-left">
                <span className="text-[16px] uppercase tracking-wide block">
                  🔔 {formatTableSpeech(callAlert.tableCode).toUpperCase()} CALLING STAFF!
                </span>
                <span className="text-[12px] font-bold text-stone-900/90 block">
                  Reason: {callAlert.reason}
                </span>
              </div>
            </motion.div>
          )}

          {cancelAlert && (
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              className="fixed left-1/2 top-20 z-50 -translate-x-1/2 flex items-center gap-3 rounded-2xl bg-rose-600 px-6 py-3.5 text-white shadow-2xl border-2 border-rose-400 font-bold"
            >
              <XCircle size={24} className="shrink-0 text-white animate-pulse" />
              <div className="text-left">
                <span className="text-[15px] uppercase tracking-wide block">
                  🚫 ORDER #{cancelAlert.code} CANCELLED!
                </span>
                <span className="text-[12px] font-medium text-rose-100 block">
                  Table {cancelAlert.tableCode} · {cancelAlert.by || 'Customer cancelled'} — Stop cooking
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* -------------------- 3-COLUMN KDS BOARD -------------------- */}
        <main className="p-7 grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 items-start">
          {/* COLUMN 1: Cooking Now */}
          <section className="bg-[#FFF5ED] border border-[#FCDCC9] rounded-[26px] p-4 flex flex-col min-h-[75vh]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F9D7C2]/70 mb-4 px-1">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#FFE3D6] flex items-center justify-center text-[#E05A2B]">
                  <ChefHat size={19} className="text-[#E05A2B]" />
                </div>
                <div>
                  <h2 className="text-[16.5px] font-extrabold text-slate-900 leading-tight">
                    Cooking Now
                  </h2>
                  <p className="text-[11px] font-medium text-slate-500 leading-tight">
                    Orders being prepared
                  </p>
                </div>
              </div>
              <span className="h-7 min-w-7 px-2 rounded-lg bg-[#F89851] text-white font-extrabold text-[13px] flex items-center justify-center shadow-2xs">
                {cookingTickets.length}
              </span>
            </div>

            {/* Tickets */}
            <div className="space-y-3.5 flex-1 overflow-y-auto">
              <AnimatePresence>
                {cookingTickets.map((ticket) => (
                  <motion.div
                    key={ticket.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm relative group hover:shadow-md transition"
                  >
                    {/* Top Row: Code, Table, Time, Menu */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 font-extrabold text-[12px] text-slate-900">
                          <Flame size={14} className="text-orange-500 fill-orange-500" />
                          #{ticket.code}
                        </span>
                        <span className="bg-[#FFEDE4] text-[#E05A2B] text-[10.5px] font-extrabold px-2 py-0.5 rounded-md">
                          {ticket.tableCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          {ticket.time} <Clock size={11} className="text-slate-400" />
                        </span>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveMenuTicket(activeMenuTicket === ticket.id ? null : ticket.id)
                            }
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition cursor-pointer"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {/* Menu Dropdown */}
                          {activeMenuTicket === ticket.id && (
                            <div className="absolute right-0 top-6 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 text-[12px] font-medium text-slate-700">
                              <button
                                onClick={() => handleRemoveTicket(ticket.id)}
                                className="w-full text-left px-3 py-1.5 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2 cursor-pointer"
                              >
                                <X size={13} /> Cancel Ticket
                              </button>
                              <button
                                onClick={() => {
                                  window.print();
                                  setActiveMenuTicket(null);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Printer size={13} /> Print Ticket
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Items & Action */}
                    {ticket.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-14 w-14 rounded-xl object-cover border border-slate-100 shrink-0 bg-slate-50"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/menu/burger.jpg';
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-bold text-slate-900 leading-snug truncate">
                              {item.name}{' '}
                              <span className="text-[11.5px] font-medium text-slate-400 ml-1">
                                × {item.qty}
                              </span>
                            </p>
                            {item.details && (
                              <p className="text-[11px] font-medium text-slate-500 leading-snug mt-0.5 truncate">
                                {item.details}
                              </p>
                            )}
                            <div className="mt-1">
                              <span className="inline-block bg-[#FFF3EB] text-[#E05A2B] border border-[#FDD9C2] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Preparing
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => handleMarkReady(ticket.id)}
                          className="bg-[#DC5E32] hover:bg-[#C54E25] text-white text-[11.5px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer shrink-0"
                        >
                          <Check size={13} strokeWidth={2.8} />
                          <span>Mark Ready</span>
                        </button>
                      </div>
                    ))}
                  </motion.div>
                ))}
              </AnimatePresence>

              {cookingTickets.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-[12px] font-semibold">
                  No orders currently cooking
                </div>
              )}
            </div>
          </section>

          {/* COLUMN 2: Ready to Serve / Collect */}
          <section className="bg-[#EDFAF1] border border-[#CFEED9] rounded-[26px] p-4 flex flex-col min-h-[75vh]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#C6ECCF]/70 mb-4 px-1">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#16A34A] flex items-center justify-center text-white shadow-2xs">
                  <Check size={18} strokeWidth={2.8} />
                </div>
                <div>
                  <h2 className="text-[16.5px] font-extrabold text-slate-900 leading-tight">
                    Ready to Serve / Collect
                  </h2>
                  <p className="text-[11px] font-medium text-slate-500 leading-tight">
                    Orders ready for pickup
                  </p>
                </div>
              </div>
              <span className="h-7 min-w-7 px-2 rounded-lg bg-[#A4E7B7] text-[#065F46] font-extrabold text-[13px] flex items-center justify-center shadow-2xs">
                {readyTickets.length}
              </span>
            </div>

            {/* Tickets */}
            <div className="space-y-3.5 flex-1 overflow-y-auto">
              <AnimatePresence>
                {readyTickets.map((ticket) => (
                  <motion.div
                    key={ticket.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm relative group hover:shadow-md transition"
                  >
                    {/* Top Row: Code, Table, Time, Menu */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 font-extrabold text-[12px] text-slate-900">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                          #{ticket.code}
                        </span>
                        <span className="bg-[#DCFCE7] text-[#16A34A] text-[10.5px] font-extrabold px-2 py-0.5 rounded-md">
                          {ticket.tableCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          {ticket.time}
                        </span>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveMenuTicket(activeMenuTicket === ticket.id ? null : ticket.id)
                            }
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition cursor-pointer"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {/* Menu Dropdown */}
                          {activeMenuTicket === ticket.id && (
                            <div className="absolute right-0 top-6 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 text-[12px] font-medium text-slate-700">
                              <button
                                onClick={() => handleRemoveTicket(ticket.id)}
                                className="w-full text-left px-3 py-1.5 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2 cursor-pointer"
                              >
                                <X size={13} /> Cancel Ticket
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Items & Action */}
                    {ticket.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-14 w-14 rounded-xl object-cover border border-slate-100 shrink-0 bg-slate-50"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/menu/burger.jpg';
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-bold text-slate-900 leading-snug truncate">
                              {item.name}{' '}
                              <span className="text-[11.5px] font-medium text-slate-400 ml-1">
                                × {item.qty}
                              </span>
                            </p>
                            {item.details && (
                              <p className="text-[11px] font-medium text-slate-500 leading-snug mt-0.5 truncate">
                                {item.details}
                              </p>
                            )}
                            <div className="mt-1">
                              <span className="inline-block bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Ready
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Button: Dark Green Serve */}
                        <button
                          onClick={() => handleServe(ticket.id)}
                          className="bg-[#17402C] hover:bg-[#113122] text-white text-[11.5px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer shrink-0"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 4V2M4 14a8 8 0 0 1 16 0H4ZM2 18h20" />
                          </svg>
                          <span>Serve</span>
                        </button>
                      </div>
                    ))}
                  </motion.div>
                ))}
              </AnimatePresence>

              {readyTickets.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-[12px] font-semibold">
                  No orders waiting for pickup
                </div>
              )}
            </div>
          </section>

          {/* COLUMN 3: Served */}
          <section className="bg-[#EEF6FD] border border-[#D5E8FA] rounded-[26px] p-4 flex flex-col min-h-[75vh]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#CCE3F8]/70 mb-4 px-1">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#0284C7] flex items-center justify-center text-white shadow-2xs">
                  <CheckCircle2 size={19} />
                </div>
                <div>
                  <h2 className="text-[16.5px] font-extrabold text-slate-900 leading-tight">
                    Served
                  </h2>
                  <p className="text-[11px] font-medium text-slate-500 leading-tight">
                    Completed orders
                  </p>
                </div>
              </div>
              <span className="h-7 min-w-7 px-2 rounded-lg bg-[#BAE6FD] text-[#0369A1] font-extrabold text-[13px] flex items-center justify-center shadow-2xs">
                {servedTickets.length}
              </span>
            </div>

            {/* Tickets */}
            <div className="space-y-3.5 flex-1 overflow-y-auto">
              <AnimatePresence>
                {servedTickets.map((ticket) => (
                  <motion.div
                    key={ticket.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm relative group hover:shadow-md transition"
                  >
                    {/* Top Row: Table Code (bold blue), Dine-In Badge, Time */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-black text-[#1D4ED8] tracking-tight">
                          {ticket.tableCode}
                        </span>
                        <span className="bg-[#DCFCE7] text-[#166534] text-[9.5px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span className="text-[9px]">🍽️</span> DINE-IN
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        {ticket.time} <Clock size={11} className="text-slate-400" />
                      </span>
                    </div>

                    {/* Middle Row: Items & Status */}
                    {ticket.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-14 w-14 rounded-xl object-cover border border-slate-100 shrink-0 bg-slate-50"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/menu/burger.jpg';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-bold text-slate-900 leading-snug truncate">
                            {item.name}{' '}
                            <span className="text-[11.5px] font-medium text-slate-400 ml-1">
                              × {item.qty}
                            </span>
                          </p>
                          {item.details && (
                            <p className="text-[11px] font-medium text-slate-500 leading-snug mt-0.5 truncate">
                              {item.details}
                            </p>
                          )}
                          <p className="text-[#16A34A] font-bold text-[11px] flex items-center gap-1 mt-1">
                            <Check size={12} strokeWidth={2.8} /> Served
                          </p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ))}
              </AnimatePresence>

              {servedTickets.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-[12px] font-semibold">
                  No completed orders yet
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
