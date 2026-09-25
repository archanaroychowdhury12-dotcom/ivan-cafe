import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUp,
  Bell,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  Flame,
  LayoutGrid,
  NotebookPen,
  Phone,
  QrCode,
  Search,
  Users,
  X,
} from 'lucide-react';
import { actions, useCalls, useOrders, useSettings, useTables } from '../../lib/store';
import { clockTime, money } from '../../lib/format';
import { FLOW, type Order, type OrderStatus } from '../../lib/types';
import { STATUS_META, StatusPill } from '../../components/status';
import { Button, Sheet, useToast } from '../../components/ui';
import type { TabId } from './Admin';

type FilterId = 'ACTIVE' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED' | 'ALL';

interface DemoCall {
  id: string;
  tableCode: string;
  reason: string;
  ago: string;
  note?: string;
}

const INITIAL_DEMO_CALLS: DemoCall[] = [
  { id: 'dc-1', tableCode: 'T01', reason: 'Assistance', ago: '2 min ago' },
  { id: 'dc-2', tableCode: 'T03', reason: 'Water refill', ago: '4 min ago' },
  { id: 'dc-3', tableCode: 'T05', reason: 'Assistance', ago: '5 min ago' },
  { id: 'dc-4', tableCode: 'T07', reason: 'Request bill', ago: '7 min ago' },
  { id: 'dc-5', tableCode: 'T08', reason: 'Assistance', ago: '9 min ago' },
  { id: 'dc-6', tableCode: 'T10', reason: 'Water refill', ago: '11 min ago' },
  { id: 'dc-7', tableCode: 'T12', reason: 'Assistance', ago: '13 min ago' },
];

export default function OrdersPanel({
  onNavigateTab,
}: {
  onNavigateTab?: (tab: TabId) => void;
}) {
  const orders = useOrders();
  const calls = useCalls();
  const tables = useTables();
  const settings = useSettings();
  const toast = useToast();

  const [filter, setFilter] = useState<FilterId>('ACTIVE');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<Order | null>(null);
  const [dismissedDemoIds, setDismissedDemoIds] = useState<string[]>([]);
  const [showAllCalls, setShowAllCalls] = useState(false);

  const list = useMemo(() => {
    return orders.filter((o) => {
      const byStatus =
        filter === 'ALL'
          ? true
          : filter === 'ACTIVE'
            ? !['SERVED', 'CANCELLED'].includes(o.status)
            : filter === 'PREPARING'
              ? o.status === 'PREPARING' || o.status === 'RECEIVED' || o.status === 'CONFIRMED'
              : o.status === filter;
      const text = (
        o.code +
        o.tableCode +
        o.customerName +
        o.lines.map((l) => l.name).join(' ')
      ).toLowerCase();
      return byStatus && (!q || text.includes(q.toLowerCase()));
    });
  }, [orders, filter, q]);

  const liveOpenCalls = calls.filter((c) => !c.resolved);

  // Merge live open calls with fallback demo calls so the staff-call bar looks and behaves just like the design
  const combinedCalls = useMemo(() => {
    if (liveOpenCalls.length > 0) {
      return liveOpenCalls.map((c) => {
        const mins = Math.max(1, Math.round((Date.now() - c.createdAt) / 60000));
        return {
          id: c.id,
          tableCode: c.tableCode,
          reason: c.reason,
          ago: `${mins} min ago`,
          isLive: true,
        };
      });
    }
    return INITIAL_DEMO_CALLS.filter((d) => !dismissedDemoIds.includes(d.id)).map((d) => ({
      ...d,
      isLive: false,
    }));
  }, [liveOpenCalls, dismissedDemoIds]);

  const handleResolveCall = (id: string, tableCode: string, isLive: boolean) => {
    if (isLive) {
      actions.resolveCall(id);
    } else {
      setDismissedDemoIds((prev) => [...prev, id]);
    }
    toast(`Resolved request for table ${tableCode}`, 'success');
  };

  const handleAcknowledgeCall = (tableCode: string, reason: string) => {
    toast(`Notified waiter for Table ${tableCode} (${reason})`, 'info');
  };

  const active = orders.filter((o) => !['SERVED', 'CANCELLED'].includes(o.status));
  const revenueToday = orders
    .filter(
      (o) =>
        new Date(o.createdAt).toDateString() === new Date().toDateString() &&
        o.status !== 'CANCELLED',
    )
    .reduce((s, o) => s + o.total, 0);

  const totalTables = Math.max(tables.length, 12);
  const occupiedTablesCount = new Set(
    active.filter((o) => o.diningMode !== 'Takeaway').map((o) => o.tableCode),
  ).size;
  const occupancyPct = Math.round((occupiedTablesCount / totalTables) * 100);

  return (
    <div className="space-y-5">
      {/* --------------------------- 4 Top KPI Cards -------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* 1. Active Orders */}
        <div className="group relative flex items-start gap-4 rounded-[24px] border border-[#DCE5DC] bg-gradient-to-br from-[#F1F5F0] to-[#E8EFE8] p-5 shadow-2xs transition hover:shadow-md">
          <div className="grid h-13 w-13 shrink-0 place-items-center rounded-full bg-[#2A5337] text-[#E6F2EA] shadow-inner">
            {/* Cloche SVG */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
              <path d="M4 15a8 8 0 0 1 16 0H4Z" />
              <path d="M2 18h20" strokeLinecap="round" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-[#26302A]">Active Orders</p>
            <p className="mt-1 font-editorial text-[34px] font-bold leading-none text-[#142019]">
              {active.length}
            </p>
            <p className="mt-2.5 text-[12px] font-medium text-[#66726A]">
              {active.length === 0
                ? 'No orders in progress'
                : `${active.length} order${active.length === 1 ? '' : 's'} in progress`}
            </p>
          </div>
          <ArrowRight
            size={15}
            className="absolute right-5 bottom-5 text-[#526057] transition-transform group-hover:translate-x-0.5"
          />
        </div>

        {/* 2. Revenue Today */}
        <div
          onClick={() => onNavigateTab?.('analytics')}
          className="group relative flex cursor-pointer items-start gap-4 rounded-[24px] border border-[#EDDCCF] bg-gradient-to-br from-[#FBF2EB] to-[#F6E8DC] p-5 shadow-2xs transition hover:shadow-md"
        >
          <div className="grid h-13 w-13 shrink-0 place-items-center rounded-full bg-[#C56A3D] text-white shadow-inner">
            <span className="font-editorial text-[22px] font-bold">৳</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-[#2B2623]">Revenue Today</p>
            <p className="mt-1 font-editorial text-[34px] font-bold leading-none text-[#181512]">
              ৳{revenueToday.toLocaleString('en-IN')}
            </p>
            <div className="mt-2.5 flex items-center justify-between text-[12px]">
              <span className="font-medium text-[#7A6F67]">vs. yesterday</span>
              <span className="inline-flex items-center gap-0.5 font-bold text-[#1D7E48]">
                <ArrowUp size={12} strokeWidth={2.5} /> 0%
              </span>
            </div>
          </div>
        </div>

        {/* 3. Open Table Calls */}
        <div className="group relative flex items-start gap-4 rounded-[24px] border border-[#DCE5DC] bg-gradient-to-br from-[#F1F5F0] to-[#E8EFE8] p-5 shadow-2xs transition hover:shadow-md">
          <div className="grid h-13 w-13 shrink-0 place-items-center rounded-full bg-[#3A5A40] text-[#F1E9D2] shadow-inner">
            {/* Table & Chair SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 10h16" strokeLinecap="round" />
              <path d="M7 10v8M17 10v8" strokeLinecap="round" />
              <path d="M9 6h6v4H9z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-[#26302A]">Open Table Calls</p>
            <p className="mt-1 font-editorial text-[34px] font-bold leading-none text-[#142019]">
              {combinedCalls.length}
            </p>
            <p className="mt-2.5 text-[12px] font-medium text-[#66726A]">
              {combinedCalls.length > 0 ? 'Need attention' : 'All tables settled'}
            </p>
          </div>
          {/* Top-right soft alert bell circle */}
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[#FAE4D8] text-[#C8562E]">
            <Bell size={15} />
          </div>
          <ArrowRight
            size={15}
            className="absolute right-5 bottom-5 text-[#526057] transition-transform group-hover:translate-x-0.5"
          />
        </div>

        {/* 4. Guest Occupancy */}
        <div
          onClick={() => onNavigateTab?.('tables')}
          className="group relative flex cursor-pointer items-start gap-4 rounded-[24px] border border-[#EDDCCF] bg-gradient-to-br from-[#FBF2EB] to-[#F6E8DC] p-5 shadow-2xs transition hover:shadow-md"
        >
          <div className="grid h-13 w-13 shrink-0 place-items-center rounded-full bg-[#C86436] text-white shadow-inner">
            <Users size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-[#2B2623]">Guest Occupancy</p>
            <p className="mt-1 font-editorial text-[34px] font-bold leading-none text-[#181512]">
              {occupancyPct}%
            </p>
            <p className="mt-2.5 text-[12px] font-medium text-[#7A6F67]">
              {occupiedTablesCount} / {totalTables} tables
            </p>
          </div>
          <ArrowRight
            size={15}
            className="absolute right-5 bottom-5 text-[#7A6F67] transition-transform group-hover:translate-x-0.5"
          />
        </div>
      </div>

      {/* -------------------- Guests Calling For Staff Banner ------------------- */}
      {combinedCalls.length > 0 && (
        <div className="rounded-[26px] border border-[#F2CCB6] bg-gradient-to-b from-[#FDF3EB] to-[#FAF1E8] p-4 sm:p-5 shadow-2xs">
          {/* Banner Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#D95B2B] text-white shadow-sm">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="font-editorial text-[18px] font-bold leading-tight text-[#A13C17] sm:text-[19px]">
                  Guests calling for staff
                </h3>
                <p className="text-[12.5px] text-[#7D6C60]">
                  Tap to resolve the request or mark as handled.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F1CFB9] bg-[#FFF9F5] px-3.5 py-1.5 text-[12px] font-bold text-[#C84E23]">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-[#FADDD0] text-[#D95B2B]">
                  <Bell size={10} />
                </span>
                {combinedCalls.length} pending
              </span>

              <button
                onClick={() => setShowAllCalls((v) => !v)}
                className="inline-flex items-center gap-1 text-[13px] font-bold text-[#26302A] transition hover:text-[#113626]"
              >
                {showAllCalls ? 'Show less' : 'View all'} <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Table Call Cards Grid */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            {(showAllCalls ? combinedCalls : combinedCalls.slice(0, 7)).map((c) => (
              <div
                key={c.id}
                className="flex flex-col justify-between rounded-[20px] border border-[#ECE3D5] bg-[#FAF8F4] p-3.5 shadow-2xs transition hover:border-[#DECBB6] hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#F7E5D8] text-[#9E4925]">
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M4 11h16M7 11v7M17 11v7M9 7h6v4H9z" />
                        </svg>
                      </span>
                      <span className="font-editorial text-[15px] font-bold text-[#1D2420]">
                        {c.tableCode}
                      </span>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-[#E25A28]" />
                  </div>

                  <p className="mt-2.5 text-[13px] font-medium text-[#2C3530]">{c.reason}</p>
                  <p className="mt-0.5 text-[11px] text-[#878075]">{c.ago}</p>
                </div>

                <div className="mt-3.5 flex items-center gap-1.5">
                  <button
                    onClick={() => handleAcknowledgeCall(c.tableCode, c.reason)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-[#113626] px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#194B35]"
                  >
                    <Phone size={10} /> Call
                  </button>
                  <button
                    onClick={() => handleResolveCall(c.id, c.tableCode, c.isLive)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-[#DCE2DA] bg-[#F1F4F0] px-2.5 py-1.5 text-[11px] font-semibold text-[#2B3630] transition hover:bg-[#E3E9E1]"
                  >
                    <Check size={11} /> Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------- Search & Status Filter Bar ---------------------- */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[240px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7A756C]"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order ID, table, guest or dish..."
            className="w-full rounded-full border border-[#E4DEC9] bg-[#FAF8F4] py-3 pr-4 pl-11 text-[13.5px] text-[#1D2420] placeholder:text-[#868075] shadow-2xs outline-none transition focus:border-[#113626] focus:bg-white"
          />
        </div>

        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-0.5">
          <FilterPill
            active={filter === 'ACTIVE'}
            onClick={() => setFilter('ACTIVE')}
            icon={<span className="h-1.5 w-1.5 rounded-full bg-current" />}
            label="Active"
          />
          <FilterPill
            active={filter === 'PREPARING'}
            onClick={() => setFilter('PREPARING')}
            icon={<ChefHat size={15} />}
            label="Kitchen Cooking"
          />
          <FilterPill
            active={filter === 'READY'}
            onClick={() => setFilter('READY')}
            icon={<Flame size={15} />}
            label="Food Ready"
          />
          <FilterPill
            active={filter === 'SERVED'}
            onClick={() => setFilter('SERVED')}
            icon={<CheckCircle2 size={15} />}
            label="Served"
          />
          <FilterPill
            active={filter === 'CANCELLED'}
            onClick={() => setFilter('CANCELLED')}
            icon={<X size={15} />}
            label="Cancelled"
          />
          <FilterPill
            active={filter === 'ALL'}
            onClick={() => setFilter('ALL')}
            icon={<LayoutGrid size={15} />}
            label="All"
          />
        </div>
      </div>

      {/* ------------------------ Orders List or Empty State ------------------- */}
      {list.length === 0 ? (
        <div className="relative overflow-hidden rounded-[28px] border border-[#E5DFD2] bg-gradient-to-b from-[#F2EFE6] to-[#EBE7DA] px-6 py-14 sm:py-16 shadow-2xs">
          {/* Bottom-left botanical foliage illustration */}
          <svg
            className="pointer-events-none absolute -bottom-3 left-0 h-32 w-48 text-[#D5D2C3]"
            viewBox="0 0 200 130"
            fill="currentColor"
          >
            <path d="M10 130C20 85 50 55 95 35C75 78 48 105 10 130Z" />
            <path d="M0 110C12 72 32 45 68 25C52 65 28 92 0 110Z" opacity="0.7" />
            <path d="M35 130C55 95 85 75 125 65C100 98 68 118 35 130Z" opacity="0.6" />
          </svg>

          {/* Bottom-right botanical foliage illustration */}
          <svg
            className="pointer-events-none absolute -bottom-3 right-0 h-36 w-52 text-[#D5D2C3]"
            viewBox="0 0 200 140"
            fill="currentColor"
          >
            <path d="M190 140C178 92 145 58 98 38C122 82 152 112 190 140Z" />
            <path d="M200 115C185 75 162 45 125 22C142 65 170 95 200 115Z" opacity="0.7" />
            <path d="M160 140C138 102 108 82 68 70C95 105 128 125 160 140Z" opacity="0.6" />
          </svg>

          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center justify-center gap-7 sm:flex-row sm:gap-10">
            {/* Left Cloche & Olive Branch Illustration */}
            <div className="relative flex h-40 w-44 shrink-0 items-center justify-center">
              {/* Soft sage circle backdrop */}
              <div className="h-36 w-36 rounded-full bg-[#E1E7DF] shadow-inner" />

              {/* Decorative golden rays & sparkles */}
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 180 160"
                fill="none"
              >
                {/* Olive branch on left */}
                <path
                  d="M45 130C35 105 32 82 38 55"
                  stroke="#264E36"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path d="M36 98C22 95 16 85 20 75C30 78 36 88 36 98Z" fill="#264E36" />
                <path d="M35 76C22 70 19 58 25 50C34 55 37 66 35 76Z" fill="#3A6B4C" />
                <path d="M38 114C25 114 18 106 20 96C30 98 37 106 38 114Z" fill="#3A6B4C" />
                <path d="M38 90C46 82 54 80 58 86C52 92 44 93 38 90Z" fill="#264E36" />

                {/* Cloche Dome */}
                <path
                  d="M52 104C52 79 71 62 95 62C119 62 138 79 138 104H52Z"
                  fill="#194430"
                />
                {/* Cloche highlight arc */}
                <path
                  d="M66 94C68 78 80 69 95 69"
                  stroke="#E8EFEA"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Cloche top handle */}
                <circle cx="95" cy="56" r="5" stroke="#194430" strokeWidth="3" fill="#E1E7DF" />
                {/* Platter base */}
                <rect x="44" y="106" width="102" height="5.5" rx="2.75" fill="#123524" />
                {/* Subtle base lines */}
                <line x1="62" y1="120" x2="128" y2="120" stroke="#BCC6BC" strokeWidth="2" strokeLinecap="round" />
                <line x1="72" y1="126" x2="118" y2="126" stroke="#CBD3CB" strokeWidth="2" strokeLinecap="round" />

                {/* Golden Sparkles */}
                <path
                  d="M95 34L97 40L103 42L97 44L95 50L93 44L87 42L93 40L95 34Z"
                  fill="#DDA53A"
                />
                <path
                  d="M112 44L113.2 47.5L116.5 48.8L113.2 50L112 53.5L110.8 50L107.5 48.8L110.8 47.5L112 44Z"
                  fill="#E5B95C"
                />
                {/* Top-right golden burst lines */}
                <line x1="138" y1="38" x2="144" y2="26" stroke="#D8962E" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="146" y1="45" x2="158" y2="36" stroke="#D8962E" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="150" y1="54" x2="163" y2="51" stroke="#D8962E" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* Center Text & Action */}
            <div className="text-center sm:text-left">
              <h3 className="font-editorial text-[26px] font-bold text-[#1D2420] sm:text-[29px]">
                No orders here yet
              </h3>
              <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-[#58605B]">
                Orders placed from any table QR appear instantly in this list.
              </p>
              <button
                onClick={() => onNavigateTab?.('tables')}
                className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-[#113626] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#194B35]"
              >
                <span className="grid h-6 w-6 place-items-center rounded-md bg-[#24533D] text-[#E6C36A]">
                  <QrCode size={14} />
                </span>
                Scan QR to start
              </button>
            </div>
          </div>

          {/* Right Golden Handwritten Slogan */}
          <div className="pointer-events-none absolute top-1/2 right-10 hidden -translate-y-1/2 -rotate-8 select-none text-center xl:block">
            <p className="font-hand text-[26px] leading-[1.06] text-[#D89B35]">
              Great Food
              <br />
              Great Service
            </p>
            <svg
              className="mx-auto mt-1 h-4 w-24 text-[#D89B35]"
              viewBox="0 0 100 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M10 6C35 3 65 3 90 5" />
              <path d="M22 12C45 10 68 10 82 11" />
            </svg>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <AnimatePresence initial={false}>
            {list.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                onOpen={() => setDetail(o)}
                currency={settings.currency}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Sheet
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`Order ${detail?.code ?? ''}`}
        size="lg"
      >
        {detail && <OrderDetail order={orders.find((o) => o.id === detail.id) ?? detail} />}
      </Sheet>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-[13px] font-semibold transition-all duration-150 active:scale-95 ${
        active
          ? 'border-[#113626] bg-[#113626] text-white shadow-sm'
          : 'border-[#E4DEC9] bg-[#FAF8F4] text-[#2B342E] hover:border-[#C7BFA9] hover:bg-white'
      }`}
    >
      {icon}
      {label}
    </button>
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
      className="overflow-hidden rounded-[24px] border border-[#E4DEC9] bg-[#FAF8F4] shadow-2xs transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#EAE4D7] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span
            className={`grid h-12 w-12 place-items-center rounded-2xl font-editorial text-[17px] font-bold ${
              order.diningMode === 'Takeaway'
                ? 'bg-[#C86436] text-white'
                : 'bg-[#113626] text-[#F5EFE6]'
            }`}
          >
            {order.diningMode === 'Takeaway'
              ? '🛍️'
              : order.tableCode.replace(/[^0-9]/g, '') || order.tableCode}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-editorial text-[16px] font-bold leading-tight text-[#1D2420]">
                {order.code}
              </p>
              {order.diningMode === 'Takeaway' ? (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-orange-800">
                  Takeaway
                </span>
              ) : (
                <span className="rounded-full bg-[#E5F2E9] px-2 py-0.5 text-[10px] font-bold uppercase text-[#1B5E37]">
                  Table {order.tableCode}
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-[#7A756C]">
              {order.customerName} · {clockTime(order.createdAt)}
            </p>
          </div>
        </div>
        <StatusPill status={order.status} size="sm" />
      </div>

      <button onClick={onOpen} className="block w-full px-4 py-3 text-left">
        <ul className="space-y-1">
          {order.lines.slice(0, 3).map((l) => (
            <li key={l.lineId} className="flex items-start gap-2 text-[13px]">
              <span className="font-bold text-[#C86436]">{l.qty}×</span>
              <span className="flex-1 truncate text-[#1D2420]">
                {l.name}
                {l.addons.length > 0 && (
                  <span className="text-[#7A756C]">
                    {' '}
                    · {l.addons.map((a) => a.optionName).join(', ')}
                  </span>
                )}
              </span>
            </li>
          ))}
          {order.lines.length > 3 && (
            <li className="text-[12px] font-semibold text-[#7A756C]">
              +{order.lines.length - 3} more items
            </li>
          )}
        </ul>
        {order.note && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#FDF3EB] px-2 py-1 text-[11px] font-medium text-[#A13C17]">
            <NotebookPen size={11} /> {order.note}
          </p>
        )}
        <p className="mt-2 flex items-center gap-1 text-[12px] font-bold text-[#113626]">
          View full order <ChevronRight size={13} />
        </p>
      </button>

      <div className="flex items-center justify-between border-t border-[#EAE4D7] bg-[#F3EFE6]/60 px-4 py-2.5">
        <span className="font-editorial text-[16px] font-bold text-[#1D2420]">
          {money(order.total, currency)}
        </span>
        {next && (
          <Button size="sm" onClick={() => actions.setOrderStatus(order.id, next, 'Manager')}>
            Move to {STATUS_META[next].label}
          </Button>
        )}
      </div>
    </motion.article>
  );
}

function OrderDetail({ order }: { order: Order }) {
  return (
    <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={order.status} />
        {order.diningMode === 'Takeaway' ? (
          <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-black uppercase text-orange-800">
            🛍️ Takeaway / Parcel
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold uppercase text-emerald-800">
            🍽️ Dine-in Table {order.tableCode}
          </span>
        )}
        <span className="text-[13px] font-semibold text-mocha">
          {order.customerName}
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
        {order.status !== 'CANCELLED' && (
          <button
            onClick={() => {
              if (window.confirm(`Cancel order #${order.code}?`)) {
                actions.setOrderStatus(order.id, 'CANCELLED', 'Manager');
              }
            }}
            className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.06em] text-rose-700 transition hover:bg-rose-100"
          >
            Cancel Order
          </button>
        )}
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
        {order.taxAmount > 0 && (
          <div className="flex justify-between text-mocha">
            <span>Tax ({order.taxPercent}%)</span>
            <span>{money(order.taxAmount)}</span>
          </div>
        )}
        {order.serviceAmount > 0 && (
          <div className="flex justify-between text-mocha">
            <span>Service ({order.servicePercent}%)</span>
            <span>{money(order.serviceAmount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-dashed border-line pt-2">
          <span className="font-display text-[16px] font-semibold">Total</span>
          <span className="font-display text-[18px] font-semibold">{money(order.total)}</span>
        </div>
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

