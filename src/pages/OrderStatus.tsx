import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
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
} from 'lucide-react';
import { actions, useOrder, useSettings } from '../lib/store';
import { clockTime, elapsed, money } from '../lib/format';
import { FLOW, type CallReason, type OrderStatus } from '../lib/types';
import { STATUS_META } from '../components/status';
import { Button, Chip, EmptyState, Sheet, useToast } from '../components/ui';
import { Mark } from '../components/Brand';
import { QRImage } from '../components/QRCode';

const REASONS: CallReason[] = ['Assistance', 'Water refill', 'Cutlery', 'Request bill', 'Cleaning'];

export default function OrderStatusPage() {
  const { code } = useParams();
  const order = useOrder(code);
  const settings = useSettings();
  const toast = useToast();
  const [, tick] = useState(0);
  const [callOpen, setCallOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [qrTab, setQrTab] = useState<'code' | 'photo'>('code');
  const [billRequested, setBillRequested] = useState(false);
  const [reason, setReason] = useState<CallReason>('Assistance');

  useEffect(() => {
    const i = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

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

  const currentStatus: OrderStatus =
    order.status === 'RECEIVED' || order.status === 'CONFIRMED' ? 'PREPARING' : order.status;
  const meta = STATUS_META[currentStatus];
  const activeIdx = Math.max(0, FLOW.indexOf(currentStatus));
  const progress = order.status === 'CANCELLED' ? 0 : Math.max(20, ((activeIdx + 1) / FLOW.length) * 100);
  const etaMins = Math.max(
    2,
    Math.round(order.lines.reduce((m, l) => Math.max(m, 8 + l.qty * 2), 8) - (Date.now() - order.createdAt) / 60000),
  );

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
                <div className="flex items-center gap-2 text-ember">
                  <meta.icon size={22} className="animate-[pulseSoft_2.4s_ease-in-out_infinite]" />
                  <span className="font-display text-[26px] font-bold leading-none text-cream">
                    {order.status === 'READY' && order.diningMode === 'Takeaway' ? 'Parcel Ready' : meta.label}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] text-cream/70">
                  {order.status === 'READY' && order.diningMode === 'Takeaway'
                    ? 'Your food has been freshly packed in takeaway boxes!'
                    : meta.blurb}
                </p>
              </motion.div>
            </AnimatePresence>

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

            {order.status !== 'SERVED' && order.status !== 'CANCELLED' && (
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

      {/* --------------------------- pay after meal card --------------------------- */}
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
            Order more
          </Button>
        </Link>
      </div>

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
    </div>
  );
}
