import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  BellRing,
  CheckCircle2,
  Copy,
  Image as ImageIcon,
  NotebookPen,
  Receipt,
  SearchX,
  Smartphone,
  Utensils,
  XCircle,
} from 'lucide-react';
import { actions, useOrder, useSettings, useSyncStatus } from '../lib/store';
import { clockTime, elapsed, money } from '../lib/format';
import { FLOW, type CallReason, type OrderStatus } from '../lib/types';
import { STATUS_META } from '../components/status';
import { Button, Chip, EmptyState, Sheet, useToast } from '../components/ui';
import { Mark } from '../components/Brand';
import { QRImage } from '../components/QRCode';
import { mapOrderFromDb, supabase } from '../lib/supabase';

const REASONS: CallReason[] = ['Assistance', 'Water refill', 'Cutlery', 'Request bill', 'Cleaning'];

const CANCEL_REASONS = [
  'Ordered by mistake',
  'Want to change items / Reorder',
  'Wait time is too long',
  'Need to leave early',
  'Other reason',
];

export default function OrderStatusPage() {
  const { code } = useParams();
  const order = useOrder(code);
  const settings = useSettings();
  const syncStatus = useSyncStatus();
  const toast = useToast();
  const [, tick] = useState(0);
  const [remoteLoading, setRemoteLoading] = useState(!order);
  const [callOpen, setCallOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelNote, setCancelNote] = useState('');
  const [qrTab, setQrTab] = useState<'code' | 'photo'>('code');
  const [billRequested, setBillRequested] = useState(false);
  const [reason, setReason] = useState<CallReason>('Assistance');

  useEffect(() => {
    const i = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  // Ensure order is loaded from Supabase even upon fresh browser refresh
  useEffect(() => {
    if (order) {
      setRemoteLoading(false);
      return;
    }

    let active = true;
    const fetchRemoteOrder = async () => {
      try {
        if (supabase && code) {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .or(`code.eq.${code},id.eq.${code}`)
            .maybeSingle();

          if (!active) return;
          if (data && !error) {
            const mapped = mapOrderFromDb(data);
            actions.injectOrder(mapped);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch order from Supabase:', err);
      } finally {
        if (active) setRemoteLoading(false);
      }
    };

    fetchRemoteOrder();

    return () => {
      active = false;
    };
  }, [code, order]);

  if (!order && remoteLoading) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent mb-4" />
        <h2 className="font-display text-lg font-bold text-stone-900">Loading Order #{code}...</h2>
        <p className="mt-1 text-xs text-stone-500">Syncing live order from Ivan Caffe kitchen</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 pt-16">
        <EmptyState
          icon={<SearchX size={22} />}
          title="Order not found"
          sub="This order ID does not exist. Check the code on your receipt or scan your table QR again."
          action={
            <Link to="/">
              <Button size="sm">Back to home</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isCancelled = order.status === 'CANCELLED';
  const currentStatus: OrderStatus =
    order.status === 'RECEIVED' || order.status === 'CONFIRMED' ? 'PREPARING' : order.status;
  const meta = STATUS_META[currentStatus];
  const activeIdx = Math.max(0, FLOW.indexOf(currentStatus));
  const progress = isCancelled ? 0 : Math.max(20, ((activeIdx + 1) / FLOW.length) * 100);
  const cancelEntry = isCancelled ? order.timeline.slice().reverse().find((t) => t.status === 'CANCELLED') : undefined;
  const etaMins = Math.max(
    2,
    Math.round(order.lines.reduce((m, l) => Math.max(m, 8 + l.qty * 2), 8) - (Date.now() - order.createdAt) / 60000),
  );

  const handleCancelOrder = () => {
    if (!order) return;
    const detail = cancelNote.trim() ? `${cancelReason} - ${cancelNote.trim()}` : cancelReason;
    actions.setOrderStatus(order.id, 'CANCELLED', `Customer (${detail})`);
    setCancelOpen(false);
    toast(`Order #${order.code} has been cancelled`, 'info');
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-16">
      <header className="flex items-center gap-3 px-4 py-4">
        <Link
          to={`/menu?table=${order.tableCode}`}
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-paper transition active:scale-90"
          aria-label="Back to menu"
        >
          <ArrowLeft size={17} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-[19px] font-semibold leading-tight">Live order</h1>
          <p className="text-[11px] font-medium text-mocha flex items-center gap-1.5">
            {order.diningMode === 'Takeaway' ? (
              <span className="font-bold text-amber-700">🛍️ Takeaway / Parcel</span>
            ) : (
              <span>🍽️ Table {order.tableCode}</span>
            )}
            <span>· {settings.cafeName}</span>
          </p>
        </div>
        <Mark size={36} />
      </header>

      {/* --------------------------- hero status card --------------------------- */}
      <section className="px-4">
        <div className="relative overflow-hidden rounded-[28px] bg-espresso px-5 py-6 text-cream shadow-lift">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-ember/25 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(order.code);
                  toast('Order ID copied');
                }}
                className="inline-flex items-center gap-2 rounded-full bg-cream/10 px-3 py-1.5 text-[12px] font-bold tracking-[0.1em]"
              >
                {order.code} <Copy size={12} />
              </button>
              <span className="text-[11px] font-medium text-cream/60">
                Placed {clockTime(order.createdAt)} · {elapsed(order.createdAt)} ago
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={order.status}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-5"
              >
                <div className={`flex items-center gap-2 ${isCancelled ? 'text-rose-400' : 'text-ember'}`}>
                  <meta.icon size={22} className={isCancelled ? '' : 'animate-[pulseSoft_2.4s_ease-in-out_infinite]'} />
                  <span className="font-display text-[26px] font-bold leading-none text-cream">
                    {order.status === 'READY' && order.diningMode === 'Takeaway' ? 'Parcel Ready' : meta.label}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] text-cream/70">
                  {isCancelled
                    ? (cancelEntry?.by ? `Cancelled by ${cancelEntry.by}` : 'This order was cancelled.')
                    : order.status === 'READY' && order.diningMode === 'Takeaway'
                      ? 'Your food has been freshly packed in takeaway boxes!'
                      : meta.blurb}
                </p>
              </motion.div>
            </AnimatePresence>

            {isCancelled ? (
              <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-berry/25 py-3 px-4 border border-berry/40 text-rose-200">
                <XCircle size={18} className="text-rose-400 shrink-0" />
                <span className="text-[12px] font-bold">
                  Order Cancelled · Kitchen has stopped cooking
                </span>
              </div>
            ) : (
              <>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-cream/15">
                  <motion.div
                    className="h-full bg-ember"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>

                <div className="mt-3 flex justify-between">
                  {FLOW.map((s, i) => (
                    <div key={s} className="flex flex-1 flex-col items-center gap-1.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${
                          i <= activeIdx ? 'bg-ember' : 'bg-cream/25'
                        } ${i === activeIdx ? 'animate-[pulseSoft_2.4s_ease-in-out_infinite] ring-4 ring-ember/25' : ''}`}
                      />
                      <span
                        className={`text-[9px] font-bold uppercase tracking-[0.08em] ${
                          i <= activeIdx ? 'text-cream' : 'text-cream/40'
                        }`}
                      >
                        {STATUS_META[s].label}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!isCancelled && order.status !== 'SERVED' && (
              <p className="mt-4 rounded-2xl bg-cream/10 px-4 py-2.5 text-center text-[12px] font-medium text-cream/80">
                {currentStatus === 'READY'
                  ? (order.diningMode === 'Takeaway'
                      ? '🛍️ Your takeaway parcel is packed and ready! Please collect it at the counter.'
                      : '🍽️ Your food is plated and ready — being served to your table now.')
                  : `🔥 Direct to Kitchen • Chef is cooking your order now • Ready in ~${etaMins} mins`}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* --------------------------- pay / cancelled card --------------------------- */}
      {isCancelled ? (
        <section className="px-4 pt-4">
          <div className="rounded-[24px] border border-rose-200 bg-rose-50/80 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚫</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-[15px] font-bold text-rose-950">
                    Order Cancelled
                  </h3>
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10.5px] font-bold uppercase text-rose-800">
                    Cancelled
                  </span>
                </div>
                <p className="mt-1 text-xs text-rose-900/80 leading-relaxed">
                  This order was cancelled {cancelEntry?.by ? `(${cancelEntry.by})` : ''}. No payment is required and the kitchen will not prepare these items.
                </p>
                <div className="mt-3">
                  <Link
                    to={`/menu?table=${order.tableCode}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#18392B] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#122A20] active:scale-95"
                  >
                    <Utensils size={14} />
                    <span>Browse Menu & Order Again</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="px-4 pt-4">
          <div className="rounded-[24px] border border-[#EADECE] bg-[#FAF6F0] p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{order.diningMode === 'Takeaway' ? '🛍️' : '🍽️'}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-[15px] font-bold text-stone-900">
                    {order.diningMode === 'Takeaway' ? 'Takeaway / Parcel Order' : 'Dine In & Pay Later'}
                  </h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase ${
                    order.diningMode === 'Takeaway' ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    Confirmed
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-600 leading-relaxed">
                  {order.diningMode === 'Takeaway'
                    ? 'Your parcel is being cooked fresh in the kitchen! Please collect your takeaway bag from the counter when ready and settle your bill.'
                    : `Your order is confirmed! Enjoy your food at Table ${order.tableCode}. You can comfortably pay after eating at the counter or request the bill directly to your table.`}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      actions.callStaff(order.tableCode, 'Request bill');
                      setBillRequested(true);
                      toast('Bill requested! A server will bring the bill to Table ' + order.tableCode, 'success');
                    }}
                    className="rounded-xl bg-[#18392B] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#122A20] active:scale-95 flex items-center gap-1.5"
                  >
                    <Receipt size={14} />
                    <span>{billRequested ? 'Bill Requested ✓' : 'Request Bill (After Meal)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayModalOpen(true)}
                    className="rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-800 transition hover:bg-stone-50"
                  >
                    💳 Settle Bill / UPI
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* -------------------------------- timeline ------------------------------- */}
      <section className="px-4 pt-4">
        <div className="rounded-[24px] border border-line/80 bg-paper p-4 shadow-card">
          <h2 className="mb-3 font-display text-[16px] font-semibold">Progress</h2>
          <ol className="space-y-3">
            {order.timeline.map((t, i) => {
              const m = STATUS_META[t.status];
              return (
                <li key={i} className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${m.dot}`} />
                  <span className="flex-1 text-[14px] font-semibold">{m.label}</span>
                  <span className="text-[12px] text-mocha">
                    {clockTime(t.at)} · {t.by}
                  </span>
                </li>
              );
            })}
            {order.status !== 'SERVED' && order.status !== 'CANCELLED' && (
              <li className="flex items-center gap-3 opacity-50">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-dashed border-mocha" />
                <span className="flex-1 text-[14px] font-semibold">
                  {STATUS_META[FLOW[Math.min(activeIdx + 1, FLOW.length - 1)]].label}
                </span>
                <span className="text-[12px] text-mocha">next</span>
              </li>
            )}
          </ol>
        </div>
      </section>

      {/* ------------------------------ order detail ----------------------------- */}
      <section className="px-4 pt-4">
        <div className="rounded-[24px] border border-line/80 bg-paper p-4 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 font-display text-[16px] font-semibold">
            <Utensils size={15} className="text-ember" /> {order.lines.length} item
            {order.lines.length > 1 ? 's' : ''} ordered
          </h2>
          <div className="space-y-3">
            {order.lines.map((l) => (
              <div key={l.lineId} className="flex gap-3">
                <img src={l.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold leading-tight">
                    {l.qty} × {l.name}
                  </p>
                  {l.addons.length > 0 && (
                    <p className="text-[12px] text-mocha">{l.addons.map((a) => a.optionName).join(' · ')}</p>
                  )}
                  {l.note && (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#8a6a1f]">
                      <NotebookPen size={10} /> {l.note}
                    </p>
                  )}
                </div>
                <span className="text-[14px] font-semibold">{money(l.unitPrice * l.qty)}</span>
              </div>
            ))}
          </div>

          {order.note && (
            <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-[12px] font-medium text-[#8a6a1f]">
              Note to kitchen: {order.note}
            </p>
          )}

          <div className="mt-4 space-y-1.5 border-t border-dashed border-line pt-3 text-[13px]">
            <div className="flex justify-between text-mocha">
              <span>Item total</span>
              <span>{money(order.subtotal)}</span>
            </div>
            {order.taxAmount > 0 && (
              <div className="flex justify-between text-mocha">
                <span>Taxes ({order.taxPercent}%)</span>
                <span>{money(order.taxAmount)}</span>
              </div>
            )}
            {order.serviceAmount > 0 && (
              <div className="flex justify-between text-mocha">
                <span>Service ({order.servicePercent}%)</span>
                <span>{money(order.serviceAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1.5">
              <span className="font-display text-[17px] font-semibold">Total</span>
              <span className="font-display text-[19px] font-semibold">{money(order.total)}</span>
            </div>
            <p className="flex items-center gap-1.5 pt-1 text-[11px] text-mocha">
              <Receipt size={11} />
              {order.paymentMode === 'COUNTER'
                ? 'Pay at the counter when you leave'
                : order.paymentMode === 'UPI'
                  ? 'UPI / wallet payment at the table'
                  : 'Card payment at the table'}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 px-4 pt-4">
        <Button variant="outline" size="lg" onClick={() => setCallOpen(true)}>
          <BellRing size={16} /> Call staff
        </Button>
        <Link to={`/menu?table=${order.tableCode}`}>
          <Button variant="dark" size="lg" full>
            {isCancelled ? 'Order Again' : 'Order more'}
          </Button>
        </Link>
      </div>

      {!isCancelled && order.status !== 'SERVED' && (
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => setCancelOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300/80 bg-rose-50/80 py-3 text-[13px] font-bold text-rose-700 transition hover:bg-rose-100/90 active:scale-[0.98]"
          >
            <XCircle size={16} /> Cancel this order
          </button>
        </div>
      )}

      {order.status === 'SERVED' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-4 mt-4 flex items-center gap-3 rounded-[24px] border border-olive/30 bg-olive/10 p-4"
        >
          <CheckCircle2 size={22} className="text-olive" />
          <p className="text-[13px] font-medium text-ink-soft">
            Order complete. Thank you for dining at {settings.cafeName} — we hope to see you again soon.
          </p>
        </motion.div>
      )}

      <Sheet open={callOpen} onClose={() => setCallOpen(false)} title="Call our staff">
        <div className="space-y-4 px-5 py-5">
          <p className="text-sm text-mocha">
            Someone will visit <strong className="text-ink">Table {order.tableCode}</strong> shortly.
          </p>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <Chip key={r} active={reason === r} onClick={() => setReason(r)}>
                {r}
              </Chip>
            ))}
          </div>
          <Button
            full
            size="lg"
            onClick={() => {
              actions.callStaff(order.tableCode, reason);
              setCallOpen(false);
              toast(`Staff notified for Table ${order.tableCode} — someone is on the way`, 'info');
            }}
            className="shadow-md shadow-amber-500/20"
          >
            <BellRing size={18} className="animate-pulse" /> Call Staff (Table {order.tableCode})
          </Button>
        </div>
      </Sheet>

      {/* Settle Bill Modal */}
      <Sheet open={payModalOpen} onClose={() => setPayModalOpen(false)} title="Settle Bill / UPI Payment">
        <div className="space-y-4 px-5 py-4">
          <div className="rounded-2xl bg-[#F4EFE6] p-4 text-center border border-[#EADECE]">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Bill</p>
            <p className="font-display text-3xl font-bold text-stone-900 mt-0.5">{money(order.total)}</p>
            <p className="text-[11px] text-stone-500 mt-1">Order #{order.code} · Table {order.tableCode}</p>
          </div>

          {/* UPI Mode Tabs */}
          <div className="flex rounded-xl bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => setQrTab('code')}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                qrTab === 'code' ? 'bg-white text-[#5f259f] shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              📱 Dynamic QR ({money(order.total)})
            </button>
            <button
              type="button"
              onClick={() => setQrTab('photo')}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                qrTab === 'photo' ? 'bg-white text-[#5f259f] shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              🖼️ Counter Stand QR
            </button>
          </div>

          {/* QR Display Card */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 text-center space-y-3 shadow-sm">
            <div className="flex items-center justify-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5f259f] text-white text-[11px] font-bold">
                पे
              </span>
              <p className="text-sm font-bold text-stone-900">PhonePe / UPI Scan & Pay</p>
            </div>

            {qrTab === 'code' ? (
              <div className="flex flex-col items-center">
                <div className="p-3 bg-white border-2 border-[#5f259f]/25 rounded-2xl shadow-sm inline-block">
                  <QRImage
                    value={`upi://pay?pa=Q438109503@ybl&pn=Ivan%20Food%20Court&am=${order.total}&cu=INR&tn=Order%20${order.code}`}
                    size={190}
                  />
                </div>
                <p className="mt-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Pre-filled with exact amount {money(order.total)}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="overflow-hidden rounded-2xl border-2 border-stone-200 max-w-[220px] shadow-sm">
                  <img
                    src="/brand/phonepe_qr.jpg"
                    alt="PhonePe Counter QR"
                    className="w-full h-auto object-cover max-h-[260px]"
                  />
                </div>
                <p className="mt-2 text-[11px] text-stone-500">
                  Matches our counter PhonePe stand
                </p>
              </div>
            )}

            <div>
              <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">UPI ID</p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <code className="text-xs font-mono font-bold text-stone-800 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
                  Q438109503@ybl
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText('Q438109503@ybl');
                    toast('UPI ID copied: Q438109503@ybl');
                  }}
                  className="rounded-lg border border-stone-200 p-1.5 hover:bg-stone-50 text-stone-600 active:scale-95"
                  title="Copy UPI ID"
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-stone-400">Works with PhonePe · Google Pay · Paytm · BHIM</p>
            </div>

            {/* Direct Mobile UPI Link */}
            <a
              href={`upi://pay?pa=Q438109503@ybl&pn=Ivan%20Food%20Court&am=${order.total}&cu=INR&tn=Order%20${order.code}`}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5f259f] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#4d1e82] active:scale-95"
            >
              <Smartphone size={14} /> Pay {money(order.total)} via UPI App
            </a>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-3 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-800 text-base">
              💵
            </span>
            <div className="text-left">
              <p className="text-xs font-bold text-stone-900">Pay at Counter (Cash / Card)</p>
              <p className="text-[11px] text-stone-500">You can also pay cash directly at the counter.</p>
            </div>
          </div>

          <Button
            full
            size="lg"
            onClick={() => {
              setPayModalOpen(false);
              toast('Thank you! Payment received confirmation will be verified by staff.', 'success');
            }}
          >
            I Have Completed Payment
          </Button>
        </div>
      </Sheet>

      {/* Cancel Order Confirmation Sheet */}
      <Sheet open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel Order">
        <div className="space-y-4 px-5 py-5">
          <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4 border border-rose-200">
            <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={20} />
            <div className="text-xs text-rose-900">
              <p className="font-bold text-sm text-rose-950 mb-0.5">
                Cancel Order #{order.code}?
              </p>
              {order.status === 'READY' ? (
                <p className="leading-relaxed">
                  ⚠️ Your food is already prepared and ready! Please only cancel if you cannot receive it.
                </p>
              ) : (
                <p className="leading-relaxed">
                  The kitchen is cooking your items right now. If you cancel, the chef will be notified immediately to stop preparing.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-2">
              Reason for cancellation
            </label>
            <div className="flex flex-wrap gap-2">
              {CANCEL_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCancelReason(r)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    cancelReason === r
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              placeholder="Any additional details..."
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-stone-800 placeholder-stone-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setCancelOpen(false)}
            >
              Keep Order
            </Button>
            <button
              type="button"
              onClick={handleCancelOrder}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-rose-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-rose-500/20 transition hover:bg-rose-700 active:scale-95"
            >
              <XCircle size={16} /> Confirm Cancel
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
