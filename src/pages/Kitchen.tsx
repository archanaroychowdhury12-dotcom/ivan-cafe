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
  NotebookPen,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import { actions, useCalls, useOrders, useSettings } from '../lib/store';
import { clockTime, elapsed } from '../lib/format';
import type { Order, OrderStatus } from '../lib/types';
import { chime, formatTableSpeech, playStaffCallAlert } from '../lib/sound';
import { Mark } from '../components/Brand';

const COLUMNS: { key: 'PREPARING' | 'READY' | 'SERVED'; title: string; sub: string; accent: string }[] = [
  { key: 'PREPARING', title: 'Cooking Now', sub: 'Direct from table / takeaway', accent: 'from-ember/30' },
  { key: 'READY', title: 'Ready to Serve / Collect', sub: 'Food plated / packed', accent: 'from-olive/30' },
  { key: 'SERVED', title: 'Served', sub: 'Completed orders', accent: 'from-cream/15' },
];

export default function KitchenPage() {
  const orders = useOrders();
  const calls = useCalls();
  const settings = useSettings();
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
    <div className="min-h-dvh bg-espresso text-cream">
      <header className="sticky top-0 z-30 border-b border-cream/10 bg-espresso/95 px-5 py-3.5 backdrop-blur">
        <div className="mx-auto flex max-w-[1700px] items-center gap-4">
          <Link to="/" className="grid h-10 w-10 place-items-center rounded-xl bg-cream/10 transition active:scale-90">
            <ArrowLeft size={18} />
          </Link>
          <Mark size={40} tone="dark" />
          <div className="flex-1">
            <h1 className="font-display text-xl font-semibold leading-tight">Kitchen Display</h1>
            <p className="text-[11px] text-cream/50">{settings.cafeName} · live tickets</p>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-cream/10 px-4 py-2 text-[12px] font-semibold sm:flex">
            <span className="h-2 w-2 animate-[pulseSoft_2.4s_ease-in-out_infinite] rounded-full bg-olive" />
            Live
          </div>
          <div className="rounded-full bg-cream/10 px-4 py-2 text-[12px] font-semibold tabular-nums">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button
            onClick={toggleSound}
            className={`grid h-10 w-10 place-items-center rounded-xl transition cursor-pointer ${
              sound ? 'bg-olive text-white' : 'bg-cream/10 text-cream/70'
            }`}
            title={sound ? 'Sound on' : 'Sound off'}
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className="fixed left-1/2 top-20 z-40 -translate-x-1/2 rounded-2xl bg-ember px-6 py-3 text-[15px] font-bold shadow-lift"
          >
            🔔 New order {flash} just came in
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

      {openCalls.length > 0 && (
        <div className="mx-auto max-w-[1700px] px-5 pt-4">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3">
            <BellRing size={16} className="text-gold" />
            <span className="text-[13px] font-bold text-gold">Table calls</span>
            {openCalls.slice(0, 6).map((c) => (
              <button
                key={c.id}
                onClick={() => actions.resolveCall(c.id)}
                className="rounded-full bg-cream/10 px-3 py-1.5 text-[12px] font-semibold transition hover:bg-cream/20"
              >
                {c.tableCode} · {c.reason} ✓
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="mx-auto grid max-w-[1700px] gap-4 px-5 py-5 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const list = buckets[col.key];
          return (
            <section
              key={col.key}
              className="flex min-h-[70vh] flex-col rounded-[26px] border border-cream/10 bg-espresso-soft"
            >
              <div className={`rounded-t-[26px] bg-gradient-to-b ${col.accent} to-transparent px-5 py-4`}>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-[22px] font-semibold">{col.title}</h2>
                  <span className="grid h-9 min-w-9 place-items-center rounded-xl bg-cream/15 px-2.5 text-[15px] font-bold tabular-nums">
                    {list.length}
                  </span>
                </div>
                <p className="text-[12px] text-cream/50">{col.sub}</p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                <AnimatePresence initial={false}>
                  {list.map((o) => (
                    <Ticket key={o.id} order={o} highlight={flash === o.code} />
                  ))}
                </AnimatePresence>
                {list.length === 0 && (
                  <div className="grid place-items-center rounded-2xl border border-dashed border-cream/15 py-14 text-center">
                    <ChefHat size={26} className="text-cream/25" />
                    <p className="mt-2 text-[13px] text-cream/40">Nothing here right now</p>
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

function Ticket({ order, highlight }: { order: Order; highlight: boolean }) {
  const mins = (Date.now() - order.createdAt) / 60000;
  const heat = mins > 15 ? 'border-berry' : mins > 8 ? 'border-gold/70' : 'border-cream/10';

  const next: { label: string; to: OrderStatus; icon: typeof Flame } =
    order.status === 'READY'
      ? { label: 'Mark served', to: 'SERVED', icon: CheckCheck }
      : { label: 'Mark ready', to: 'READY', icon: HandPlatter };

  const Icon = next.icon;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        boxShadow: highlight ? '0 0 0 3px rgba(194,87,31,0.8)' : '0 0 0 0 rgba(0,0,0,0)',
      }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className={`rounded-[22px] border bg-espresso p-4 ${heat}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-[26px] font-semibold leading-none">{order.tableCode}</p>
            {order.diningMode === 'Takeaway' ? (
              <span className="rounded-lg bg-ember px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white shadow-sm">
                🛍️ Takeaway / Parcel
              </span>
            ) : (
              <span className="rounded-lg bg-olive/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-olive">
                🍽️ Dine-in
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] font-bold tracking-[0.1em] text-cream/45">{order.code}</p>
        </div>
        <div className="text-right">
          <p
            className={`font-display text-[20px] font-semibold tabular-nums ${
              mins > 15 ? 'text-berry' : mins > 8 ? 'text-gold' : 'text-cream/80'
            }`}
          >
            {elapsed(order.createdAt)}
          </p>
          <p className="text-[11px] text-cream/40">{clockTime(order.createdAt)}</p>
        </div>
      </div>

      <ul className="mt-3 space-y-2 border-t border-cream/10 pt-3">
        {order.lines.map((l) => (
          <li key={l.lineId}>
            <div className="flex gap-2.5">
              <span className="grid h-7 min-w-7 shrink-0 place-items-center rounded-lg bg-ember px-1.5 text-[13px] font-bold">
                {l.qty}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-semibold leading-snug">{l.name}</p>
                {l.addons.length > 0 && (
                  <p className="text-[12px] leading-snug text-cream/55">
                    {l.addons.map((a) => a.optionName).join(' · ')}
                  </p>
                )}
                {l.note && (
                  <p className="mt-1 inline-flex items-start gap-1 rounded-md bg-gold/15 px-2 py-0.5 text-[12px] font-medium text-gold">
                    <NotebookPen size={11} className="mt-0.5" /> {l.note}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {order.note && (
        <p className="mt-3 rounded-xl bg-berry/20 px-3 py-2 text-[13px] font-medium text-[#ffc7d3]">
          ⚠ {order.note}
        </p>
      )}

      {order.status !== 'SERVED' ? (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => actions.setOrderStatus(order.id, next.to, 'Kitchen')}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-cream text-[14px] font-bold text-espresso transition active:scale-[0.97]"
          >
            <Icon size={17} /> {next.label}
          </button>
          {order.status === 'READY' && (
            <button
              onClick={() => actions.setOrderStatus(order.id, 'PREPARING', 'Kitchen')}
              className="h-12 rounded-2xl border border-cream/20 px-4 text-[13px] font-semibold text-cream/70 transition hover:bg-cream/10"
            >
              Undo
            </button>
          )}
        </div>
      ) : (
        <div className="mt-3 rounded-xl bg-cream/10 py-2.5 text-center text-[12px] font-bold text-cream/70">
          Served ✓
        </div>
      )}
    </motion.article>
  );
}
