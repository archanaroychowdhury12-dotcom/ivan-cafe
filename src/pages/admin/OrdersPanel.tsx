import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BellRing,
  ChevronRight,
  Inbox,
  NotebookPen,
  Search,
  Timer,
  Users,
  XCircle,
} from 'lucide-react';
import { actions, useCalls, useOrders, useSettings } from '../../lib/store';
import { clockTime, elapsed, money } from '../../lib/format';
import { FLOW, type Order, type OrderStatus } from '../../lib/types';
import { STATUS_META, StatusPill } from '../../components/status';
import { Button, Chip, EmptyState, Sheet } from '../../components/ui';

const FILTERS: (OrderStatus | 'ALL' | 'ACTIVE')[] = [
  'ACTIVE',
  'RECEIVED',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'SERVED',
  'ALL',
];

export default function OrdersPanel() {
  const orders = useOrders();
  const calls = useCalls();
  const settings = useSettings();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ACTIVE');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<Order | null>(null);

  const list = useMemo(() => {
    return orders.filter((o) => {
      const byStatus =
        filter === 'ALL'
          ? true
          : filter === 'ACTIVE'
            ? !['SERVED', 'CANCELLED'].includes(o.status)
            : o.status === filter;
      const text = (o.code + o.tableCode + o.customerName + o.lines.map((l) => l.name).join(' ')).toLowerCase();
      return byStatus && (!q || text.includes(q.toLowerCase()));
    });
  }, [orders, filter, q]);

  const openCalls = calls.filter((c) => !c.resolved);
  const active = orders.filter((o) => !['SERVED', 'CANCELLED'].includes(o.status));
  const revenueToday = orders
    .filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString() && o.status !== 'CANCELLED')
    .reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Active orders" value={String(active.length)} icon={<Timer size={16} />} tone="ember" />
        <Stat
          label="Revenue today"
          value={money(revenueToday, settings.currency)}
          icon={<Users size={16} />}
          tone="olive"
        />
        <Stat label="Open table calls" value={String(openCalls.length)} icon={<BellRing size={16} />} tone="gold" />
      </div>

      {openCalls.length > 0 && (
        <div className="rounded-[24px] border border-gold/40 bg-gold/10 p-4">
          <h3 className="mb-2 flex items-center gap-2 font-display text-[16px] font-semibold text-[#8a6a1f]">
            <BellRing size={16} /> Guests calling for staff
          </h3>
          <div className="flex flex-wrap gap-2">
            {openCalls.map((c) => (
              <button
                key={c.id}
                onClick={() => actions.resolveCall(c.id)}
                className="group flex items-center gap-2 rounded-2xl border border-line bg-paper px-3.5 py-2 text-[13px] font-semibold shadow-card transition hover:border-olive"
              >
                <span className="font-display text-[15px]">{c.tableCode}</span>
                <span className="text-mocha">{c.reason}</span>
                {c.note && <span className="text-[11px] italic text-mocha">“{c.note}”</span>}
                <span className="rounded-lg bg-olive/15 px-2 py-0.5 text-[11px] font-bold text-olive">
                  Resolve
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mocha" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order ID, table, guest or dish"
            className="w-full rounded-2xl border border-line bg-paper py-3 pl-10 pr-3 text-[14px] outline-none focus:border-ember focus:ring-4 focus:ring-ember/10"
          />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f === 'ALL' ? 'All' : f === 'ACTIVE' ? 'Active' : STATUS_META[f as OrderStatus].label}
            </Chip>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Inbox size={22} />}
          title="No orders here yet"
          sub="Orders placed from any table QR appear instantly in this list."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <AnimatePresence initial={false}>
            {list.map((o) => (
              <OrderCard key={o.id} order={o} onOpen={() => setDetail(o)} currency={settings.currency} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Sheet open={!!detail} onClose={() => setDetail(null)} title={`Order ${detail?.code ?? ''}`} size="lg">
        {detail && <OrderDetail order={orders.find((o) => o.id === detail.id) ?? detail} />}
      </Sheet>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: 'ember' | 'olive' | 'gold';
}) {
  const tones = {
    ember: 'bg-ember-soft text-ember-deep',
    olive: 'bg-olive/12 text-olive',
    gold: 'bg-gold/15 text-[#8a6a1f]',
  };
  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-line bg-paper p-4 shadow-card">
      <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tones[tone]}`}>{icon}</span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-mocha">{label}</p>
        <p className="font-display text-[22px] font-semibold leading-tight">{value}</p>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onOpen,
  currency,
}: {
  order: Order;
  onOpen: () => void;
  currency: string;
}) {
  const idx = FLOW.indexOf(order.status);
  const next = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="overflow-hidden rounded-[26px] border border-line bg-paper shadow-card transition hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-3 border-b border-line/70 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink font-display text-[17px] font-semibold text-cream">
            {order.tableCode.replace(/[^0-9]/g, '') || order.tableCode}
          </span>
          <div>
            <p className="font-display text-[16px] font-semibold leading-tight">{order.code}</p>
            <p className="text-[11px] font-medium text-mocha">
              {order.customerName} · {clockTime(order.createdAt)} · {elapsed(order.createdAt)}
            </p>
          </div>
        </div>
        <StatusPill status={order.status} size="sm" />
      </div>

      <button onClick={onOpen} className="block w-full px-4 py-3 text-left">
        <ul className="space-y-1">
          {order.lines.slice(0, 3).map((l) => (
            <li key={l.lineId} className="flex items-start gap-2 text-[13px]">
              <span className="font-bold text-ember">{l.qty}×</span>
              <span className="flex-1 truncate">
                {l.name}
                {l.addons.length > 0 && (
                  <span className="text-mocha"> · {l.addons.map((a) => a.optionName).join(', ')}</span>
                )}
              </span>
            </li>
          ))}
          {order.lines.length > 3 && (
            <li className="text-[12px] font-semibold text-mocha">+{order.lines.length - 3} more items</li>
          )}
        </ul>
        {order.note && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-lg bg-gold/12 px-2 py-1 text-[11px] font-medium text-[#8a6a1f]">
            <NotebookPen size={11} /> {order.note}
          </p>
        )}
        <p className="mt-2 flex items-center gap-1 text-[12px] font-bold text-ember">
          View full order <ChevronRight size={13} />
        </p>
      </button>

      <div className="flex items-center gap-2 border-t border-line/70 bg-cream/40 px-4 py-3">
        <span className="font-display text-[17px] font-semibold">{money(order.total, currency)}</span>
        <span className="flex-1" />
        {order.status !== 'SERVED' && order.status !== 'CANCELLED' && (
          <button
            onClick={() => actions.setOrderStatus(order.id, 'CANCELLED', 'Manager')}
            className="grid h-9 w-9 place-items-center rounded-xl text-mocha transition hover:bg-berry/10 hover:text-berry"
            title="Cancel order"
          >
            <XCircle size={16} />
          </button>
        )}
        {next && (
          <Button size="sm" onClick={() => actions.setOrderStatus(order.id, next, 'Counter')}>
            Mark {STATUS_META[next].label}
          </Button>
        )}
      </div>
    </motion.article>
  );
}

function OrderDetail({ order }: { order: Order }) {
  return (
    <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill status={order.status} />
        <span className="text-[13px] font-semibold text-mocha">
          Table {order.tableCode} · {order.customerName}
          {order.customerPhone ? ` · ${order.customerPhone}` : ''}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FLOW.map((s) => (
          <button
            key={s}
            onClick={() => actions.setOrderStatus(order.id, s, 'Manager')}
            className={`rounded-xl px-3 py-2 text-[12px] font-bold uppercase tracking-[0.06em] transition ${
              order.status === s
                ? STATUS_META[s].solid
                : 'border border-line bg-paper text-ink-soft hover:border-ember hover:text-ember'
            }`}
          >
            {STATUS_META[s].label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {order.lines.map((l) => (
          <div key={l.lineId} className="flex gap-3 rounded-2xl border border-line bg-cream/40 p-3">
            <img src={l.image} alt="" className="h-16 w-16 rounded-xl object-cover" />
            <div className="flex-1">
              <p className="text-[14px] font-semibold">
                {l.qty} × {l.name}
              </p>
              {l.addons.length > 0 && (
                <ul className="mt-0.5 text-[12px] text-mocha">
                  {l.addons.map((a, i) => (
                    <li key={i}>
                      {a.groupName}: {a.optionName}
                      {a.price ? ` (+${money(a.price)})` : ''}
                    </li>
                  ))}
                </ul>
              )}
              {l.note && (
                <p className="mt-1 rounded-lg bg-gold/12 px-2 py-1 text-[11px] font-medium text-[#8a6a1f]">
                  “{l.note}”
                </p>
              )}
            </div>
            <span className="text-[14px] font-semibold">{money(l.unitPrice * l.qty)}</span>
          </div>
        ))}
      </div>

      {order.note && (
        <p className="mt-3 rounded-2xl bg-gold/12 px-3 py-2.5 text-[13px] font-medium text-[#8a6a1f]">
          Customer note: {order.note}
        </p>
      )}

      <div className="mt-4 space-y-1.5 rounded-2xl border border-line bg-paper p-4 text-[13px]">
        <div className="flex justify-between text-mocha">
          <span>Subtotal</span>
          <span>{money(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-mocha">
          <span>Tax ({order.taxPercent}%)</span>
          <span>{money(order.taxAmount)}</span>
        </div>
        <div className="flex justify-between text-mocha">
          <span>Service ({order.servicePercent}%)</span>
          <span>{money(order.serviceAmount)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-dashed border-line pt-2">
          <span className="font-display text-[16px] font-semibold">Total</span>
          <span className="font-display text-[18px] font-semibold">{money(order.total)}</span>
        </div>
        <p className="text-[11px] text-mocha">Payment: {order.paymentMode}</p>
      </div>

      <div className="mt-4">
        <h4 className="mb-2 font-display text-[15px] font-semibold">Audit trail</h4>
        <ol className="space-y-1.5 text-[12px]">
          {order.timeline.map((t, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${STATUS_META[t.status].dot}`} />
              <span className="font-semibold">{STATUS_META[t.status].label}</span>
              <span className="text-mocha">
                {clockTime(t.at)} · by {t.by}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
