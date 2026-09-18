import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BellRing,
  ChefHat,
  CheckCheck,
  Flame,
  HandPlatter,
  Moon,
  NotebookPen,
  Sun,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import { actions, useCalls, useOrders, useSettings } from '../lib/store';
import { clockTime, elapsed } from '../lib/format';
import type { Order, OrderStatus } from '../lib/types';
import { chime, formatTableSpeech, playStaffCallAlert } from '../lib/sound';
import { Mark } from '../components/Brand';

const COLUMNS: {
  key: 'PREPARING' | 'READY' | 'SERVED';
  title: string;
  sub: string;
  accentLight: string;
  accentDark: string;
}[] = [
  {
    key: 'PREPARING',
    title: 'Cooking Now',
    sub: 'Direct from table / takeaway',
    accentLight: 'from-amber-200/60 border-amber-300/60',
    accentDark: 'from-ember/30 border-cream/10',
  },
  {
    key: 'READY',
    title: 'Ready to Serve / Collect',
    sub: 'Food plated / packed',
    accentLight: 'from-emerald-200/60 border-emerald-300/60',
    accentDark: 'from-olive/30 border-cream/10',
  },
  {
    key: 'SERVED',
    title: 'Served',
    sub: 'Completed orders',
    accentLight: 'from-stone-200/60 border-stone-300/60',
    accentDark: 'from-cream/15 border-cream/10',
  },
];

export default function KitchenPage() {
  const orders = useOrders();
  const calls = useCalls();
  const settings = useSettings();

  // Light theme by default as requested, with localStorage persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('kitchen_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const isLight = theme === 'light';

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('kitchen_theme', next);
      } catch {}
      return next;
    });
  };

  const [sound, setSound] = useState(() => {
    const saved = localStorage.getItem('kitchen_sound');
    return saved !== null ? saved === 'true' : true;
  });
  const [flash, setFlash] = useState<string | null>(null);
  const [callAlert, setCallAlert] = useState<{ tableCode: string; reason: string } | null>(null);
  const [cancelAlert, setCancelAlert] = useState<{ code: string; tableCode: string; by?: string } | null>(null);
  const [, tick] = useState(0);
  const seen = useRef<Set<string>>(new Set(orders.map((o) => o.id)));
  const seenCalls = useRef<Set<string>>(new Set(calls.map((c) => c.id)));
  const seenCancelled = useRef<Set<string>>(new Set(orders.filter((o) => o.status === 'CANCELLED').map((o) => o.id)));

  useEffect(() => {
    const i = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  // Track incoming new orders
  useEffect(() => {
    const fresh = orders.filter((o) => !seen.current.has(o.id));
    if (fresh.length) {
      fresh.forEach((o) => seen.current.add(o.id));
      const newest = fresh[0];
      setFlash(newest.code);
      if (sound) chime();
      const t = setTimeout(() => setFlash(null), 4000);
      return () => clearTimeout(t);
    }
  }, [orders, sound]);

  // Track cancelled orders in kitchen
  useEffect(() => {
    const freshCancelled = orders.filter((o) => o.status === 'CANCELLED' && !seenCancelled.current.has(o.id));
    if (freshCancelled.length) {
      freshCancelled.forEach((o) => seenCancelled.current.add(o.id));
      const newest = freshCancelled[0];
      const by = newest.timeline.slice().reverse().find((t) => t.status === 'CANCELLED')?.by;
      setCancelAlert({ code: newest.code, tableCode: newest.tableCode, by });
      if (sound) chime();
      const t = setTimeout(() => setCancelAlert(null), 7000);
      return () => clearTimeout(t);
    }
  }, [orders, sound]);

  // Track incoming staff calls: ring and speak "Table X, call staff"
  useEffect(() => {
    const freshCalls = calls.filter((c) => !c.resolved && !seenCalls.current.has(c.id));
    if (freshCalls.length) {
      freshCalls.forEach((c) => seenCalls.current.add(c.id));
      const newest = freshCalls[0];
      setCallAlert({ tableCode: newest.tableCode, reason: newest.reason });
      if (sound) {
        playStaffCallAlert(newest.tableCode);
      }
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

  const buckets = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'CANCELLED');
    return {
      PREPARING: active
        .filter((o) => o.status === 'PREPARING' || o.status === 'RECEIVED' || o.status === 'CONFIRMED')
        .reverse(),
      READY: active.filter((o) => o.status === 'READY').reverse(),
      SERVED: active.filter((o) => o.status === 'SERVED').slice(-15).reverse(),
    };
  }, [orders]);

  const openCalls = calls.filter((c) => !c.resolved);

  return (
    <div
      className={`min-h-dvh transition-colors duration-200 ${
        isLight ? 'bg-[#F4EFE6] text-stone-900' : 'bg-espresso text-cream'
      }`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-30 border-b px-5 py-3.5 backdrop-blur transition-colors duration-200 ${
          isLight
            ? 'border-[#DFD7C7] bg-[#FDFBF7]/95 text-stone-900 shadow-2xs'
            : 'border-cream/10 bg-espresso/95 text-cream'
        }`}
      >
        <div className="mx-auto flex max-w-[1700px] items-center gap-4">
          <Link
            to="/"
            className={`grid h-10 w-10 place-items-center rounded-xl transition active:scale-90 ${
              isLight
                ? 'bg-stone-200/80 text-stone-800 hover:bg-stone-300'
                : 'bg-cream/10 text-cream hover:bg-cream/20'
            }`}
            aria-label="Back to home"
          >
            <ArrowLeft size={18} />
          </Link>

          <Mark size={40} tone={isLight ? 'light' : 'dark'} />

          <div className="flex-1">
            <h1 className="font-display text-xl font-bold leading-tight">Kitchen Display (KDS)</h1>
            <p className={`text-[11px] font-semibold ${isLight ? 'text-stone-500' : 'text-cream/50'}`}>
              {settings.cafeName} · Live chef tickets
            </p>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-black transition cursor-pointer shadow-xs ${
              isLight
                ? 'bg-amber-100/90 text-amber-950 border border-amber-300 hover:bg-amber-200'
                : 'bg-cream/10 text-cream border border-cream/15 hover:bg-cream/20'
            }`}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle theme"
          >
            {isLight ? (
              <>
                <Sun size={16} className="text-amber-600 fill-amber-500" />
                <span className="hidden sm:inline">Light Theme</span>
              </>
            ) : (
              <>
                <Moon size={16} className="text-amber-300 fill-amber-400" />
                <span className="hidden sm:inline">Dark Theme</span>
              </>
            )}
          </button>

          {/* Live Indicator */}
          <div
            className={`hidden items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold sm:flex ${
              isLight
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-cream/10 text-cream'
            }`}
          >
            <span className="h-2.5 w-2.5 animate-[pulseSoft_2.4s_ease-in-out_infinite] rounded-full bg-emerald-600" />
            Live Sync
          </div>

          {/* Clock */}
          <div
            className={`rounded-full px-4 py-2 text-[12px] font-black tabular-nums ${
              isLight
                ? 'bg-stone-200/80 text-stone-900 border border-stone-300'
                : 'bg-cream/10 text-cream'
            }`}
          >
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`grid h-10 w-10 place-items-center rounded-xl transition cursor-pointer shadow-xs ${
              sound
                ? isLight
                  ? 'bg-[#18392B] text-white hover:bg-[#122A20]'
                  : 'bg-olive text-white'
                : isLight
                ? 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                : 'bg-cream/10 text-cream/70 hover:bg-cream/20'
            }`}
            title={sound ? 'Sound alert on' : 'Sound alert muted'}
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>

      {/* Floating Notifications */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className="fixed left-1/2 top-20 z-40 -translate-x-1/2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 text-[15px] font-extrabold shadow-2xl border-2 border-amber-300"
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
              <span className="text-[17px] uppercase tracking-wide block">
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
              <span className="text-[16px] uppercase tracking-wide block">
                🚫 ORDER #{cancelAlert.code} CANCELLED!
              </span>
              <span className="text-[12px] font-medium text-rose-100 block">
                Table {cancelAlert.tableCode} · {cancelAlert.by || 'Customer cancelled'} — Stop cooking
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff Calls Banner */}
      {openCalls.length > 0 && (
        <div className="mx-auto max-w-[1700px] px-5 pt-4">
          <div
            className={`flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-3 shadow-xs ${
              isLight
                ? 'border-amber-300 bg-amber-50/90 text-amber-950'
                : 'border-gold/30 bg-gold/10 text-gold'
            }`}
          >
            <BellRing size={16} className={isLight ? 'text-amber-700' : 'text-gold'} />
            <span className="text-[13px] font-black">Active Table Calls:</span>
            {openCalls.slice(0, 6).map((c) => (
              <button
                key={c.id}
                onClick={() => actions.resolveCall(c.id)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition cursor-pointer shadow-2xs ${
                  isLight
                    ? 'bg-amber-200 hover:bg-amber-300 text-amber-950 border border-amber-300'
                    : 'bg-cream/10 hover:bg-cream/20 text-cream'
                }`}
              >
                {c.tableCode} · {c.reason} ✓
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3-Column KDS Board */}
      <main className="mx-auto grid max-w-[1700px] gap-4 px-5 py-5 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const list = buckets[col.key];
          const accent = isLight ? col.accentLight : col.accentDark;

          return (
            <section
              key={col.key}
              className={`flex min-h-[70vh] flex-col rounded-[26px] border transition-colors duration-200 ${
                isLight
                  ? 'border-[#DFD7C7] bg-[#EAE4D7]/75 shadow-xs'
                  : 'border-cream/10 bg-espresso-soft'
              }`}
            >
              {/* Column Header */}
              <div
                className={`rounded-t-[26px] bg-gradient-to-b ${accent} to-transparent px-5 py-4 border-b ${
                  isLight ? 'border-stone-300/40' : 'border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-[22px] font-extrabold tracking-tight">
                    {col.title}
                  </h2>
                  <span
                    className={`grid h-9 min-w-9 place-items-center rounded-xl px-2.5 text-[15px] font-black tabular-nums shadow-xs ${
                      isLight ? 'bg-white text-stone-900 border border-stone-200' : 'bg-cream/15 text-cream'
                    }`}
                  >
                    {list.length}
                  </span>
                </div>
                <p className={`text-[12px] font-medium ${isLight ? 'text-stone-600' : 'text-cream/50'}`}>
                  {col.sub}
                </p>
              </div>

              {/* Tickets List */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                <AnimatePresence initial={false}>
                  {list.map((o) => (
                    <Ticket
                      key={o.id}
                      order={o}
                      highlight={flash === o.code}
                      isLight={isLight}
                    />
                  ))}
                </AnimatePresence>

                {list.length === 0 && (
                  <div
                    className={`grid place-items-center rounded-2xl border border-dashed py-14 text-center ${
                      isLight ? 'border-stone-300 bg-white/40' : 'border-cream/15'
                    }`}
                  >
                    <ChefHat
                      size={28}
                      className={isLight ? 'text-stone-400' : 'text-cream/25'}
                    />
                    <p className={`mt-2 text-[13px] font-semibold ${isLight ? 'text-stone-500' : 'text-cream/40'}`}>
                      No tickets in this section
                    </p>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}

function Ticket({
  order,
  highlight,
  isLight,
}: {
  order: Order;
  highlight: boolean;
  isLight: boolean;
}) {
  const mins = (Date.now() - order.createdAt) / 60000;

  // Visual heat indicator based on elapsed waiting time
  const heatClasses = isLight
    ? mins > 15
      ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-400/40'
      : mins > 8
      ? 'border-amber-400 bg-amber-50/30 ring-1 ring-amber-300/60'
      : 'border-stone-200/90 bg-white shadow-sm hover:shadow-md'
    : mins > 15
    ? 'border-berry'
    : mins > 8
    ? 'border-gold/70'
    : 'border-cream/10';

  const next: { label: string; to: OrderStatus; icon: typeof Flame } =
    order.status === 'READY'
      ? { label: 'Mark Served', to: 'SERVED', icon: CheckCheck }
      : { label: 'Mark Ready', to: 'READY', icon: HandPlatter };

  const Icon = next.icon;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        boxShadow: highlight
          ? '0 0 0 3px rgba(217,119,6,0.9)'
          : isLight
          ? '0 1px 3px rgba(0,0,0,0.06)'
          : '0 0 0 0 rgba(0,0,0,0)',
      }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className={`rounded-[22px] border p-4 transition-all ${
        isLight ? 'text-stone-900' : 'bg-espresso text-cream'
      } ${heatClasses}`}
    >
      {/* Ticket Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-[26px] font-black leading-none text-stone-950">
              {order.tableCode}
            </p>
            {order.diningMode === 'Takeaway' ? (
              <span className="rounded-lg bg-orange-600 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white shadow-xs">
                🛍️ Takeaway / Parcel
              </span>
            ) : (
              <span
                className={`rounded-lg px-2 py-0.5 text-[11px] font-black uppercase tracking-wider ${
                  isLight
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    : 'bg-olive/20 text-olive'
                }`}
              >
                🍽️ Dine-in
              </span>
            )}
          </div>
          <p
            className={`mt-1 text-[11px] font-extrabold tracking-[0.1em] font-mono ${
              isLight ? 'text-stone-500' : 'text-cream/45'
            }`}
          >
            #{order.code}
          </p>
        </div>

        {/* Timer */}
        <div className="text-right">
          <p
            className={`font-display text-[20px] font-black tabular-nums leading-none ${
              mins > 15
                ? 'text-rose-600 animate-pulse'
                : mins > 8
                ? isLight
                  ? 'text-amber-700'
                  : 'text-gold'
                : isLight
                ? 'text-stone-800'
                : 'text-cream/80'
            }`}
          >
            {elapsed(order.createdAt)}
          </p>
          <p
            className={`text-[11px] font-semibold mt-0.5 ${
              isLight ? 'text-stone-400' : 'text-cream/40'
            }`}
          >
            {clockTime(order.createdAt)}
          </p>
        </div>
      </div>

      {/* Dishes List */}
      <ul
        className={`mt-3 space-y-2 border-t pt-3 ${
          isLight ? 'border-stone-100' : 'border-cream/10'
        }`}
      >
        {order.lines.map((l) => (
          <li key={l.lineId}>
            <div className="flex gap-2.5">
              <span
                className={`grid h-7 min-w-7 shrink-0 place-items-center rounded-lg px-1.5 text-[13px] font-black shadow-xs ${
                  isLight ? 'bg-[#18392B] text-white' : 'bg-ember text-white'
                }`}
              >
                {l.qty}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[15.5px] font-bold leading-snug ${
                    isLight ? 'text-stone-950' : 'text-white'
                  }`}
                >
                  {l.name}
                </p>
                {l.addons.length > 0 && (
                  <p
                    className={`text-[11.5px] leading-snug font-semibold mt-0.5 ${
                      isLight ? 'text-stone-600' : 'text-cream/55'
                    }`}
                  >
                    {l.addons.map((a) => a.optionName).join(' · ')}
                  </p>
                )}
                {l.note && (
                  <p
                    className={`mt-1 inline-flex items-start gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-bold border ${
                      isLight
                        ? 'bg-amber-100 text-amber-950 border-amber-300'
                        : 'bg-gold/15 text-gold border-transparent'
                    }`}
                  >
                    <NotebookPen size={11} className="mt-0.5 shrink-0" /> {l.note}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Customer Note */}
      {order.note && (
        <p
          className={`mt-3 rounded-xl px-3 py-2 text-[12.5px] font-bold border ${
            isLight
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-berry/20 text-[#ffc7d3] border-transparent'
          }`}
        >
          ⚠ {order.note}
        </p>
      )}

      {/* Actions */}
      {order.status !== 'SERVED' ? (
        <div className="mt-3.5 flex items-center gap-2">
          <button
            onClick={() => actions.setOrderStatus(order.id, next.to, 'Kitchen')}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-[14px] font-black transition active:scale-[0.97] cursor-pointer shadow-xs ${
              isLight
                ? next.to === 'SERVED'
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-[#18392B] hover:bg-[#122A20] text-white'
                : 'bg-cream text-espresso hover:bg-white'
            }`}
          >
            <Icon size={18} strokeWidth={2.5} />
            <span>{next.label}</span>
          </button>

          {order.status === 'READY' && (
            <button
              onClick={() => actions.setOrderStatus(order.id, 'PREPARING', 'Kitchen')}
              className={`h-12 rounded-2xl px-4 text-[13px] font-bold transition cursor-pointer ${
                isLight
                  ? 'border border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200'
                  : 'border border-cream/20 text-cream/70 hover:bg-cream/10'
              }`}
            >
              Undo
            </button>
          )}
        </div>
      ) : (
        <div
          className={`mt-3 rounded-xl py-2.5 text-center text-[12px] font-black ${
            isLight
              ? 'bg-stone-100 text-stone-600 border border-stone-200'
              : 'bg-cream/10 text-cream/70'
          }`}
        >
          Served ✓
        </div>
      )}
    </motion.article>
  );
}
