import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  BellRing,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Heart,
  Image as ImageIcon,
  MapPin,
  MessageSquareHeart,
  NotebookPen,
  Receipt,
  SearchX,
  Send,
  Sparkles,
  Star,
  ThumbsUp,
  Utensils,
  XCircle,
} from 'lucide-react';
import { actions, useOrder, useSettings, useSyncStatus } from '../lib/store';
import { clockTime, money } from '../lib/format';
import { FLOW, type CallReason, type OrderStatus } from '../lib/types';
import { STATUS_META } from '../components/status';
import { Button, Chip, EmptyState, Sheet, useToast } from '../components/ui';
import { Mark } from '../components/Brand';
import { mapOrderFromDb, supabase } from '../lib/supabase';

const GOOGLE_MAPS_REVIEW_URL = 'https://maps.app.goo.gl/FWKo4hBFPVtqYvph9?g_st=ic';
const FACEBOOK_CHANNEL_URL = 'https://www.facebook.com/share/1Dhjd93nm1/?mibextid=wwXIfr';

const QUICK_REVIEW_TAGS = [
  'Delicious 😍',
  'Very Tasty 🔥',
  'Fresh & Hot ✨',
  'Loved It ❤️',
  'Good Portion 👌',
  'Average 😐',
];

const REASONS: CallReason[] = ['Assistance', 'Water refill', 'Cutlery', 'Cleaning'];

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
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelNote, setCancelNote] = useState('');
  const [reason, setReason] = useState<CallReason>('Assistance');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [ratingPromptDismissed, setRatingPromptDismissed] = useState(false);
  const [rating, setRating] = useState(5);
  const [itemRatings, setItemRatings] = useState<
    Record<string, { rating: number; comment: string; tags: string[] }>
  >({});
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [overallFeedback, setOverallFeedback] = useState('');

  const handleCloseFeedback = () => {
    setFeedbackOpen(false);
    setRatingPromptDismissed(true);
  };

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
        <p className="mt-1 text-xs text-stone-500">Syncing live order from Ivan Food Court kitchen</p>
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

  useEffect(() => {
    if (!order) return;
    const initial: Record<string, { rating: number; comment: string; tags: string[] }> = {};
    order.lines.forEach((l) => {
      initial[l.lineId] = {
        rating: l.rating || 5,
        comment: l.reviewComment || '',
        tags: l.reviewTags || (l.rating && l.rating >= 4 ? ['Delicious 😍'] : []),
      };
    });
    setItemRatings(initial);
  }, [order?.id, order?.lines]);

  const handleItemRatingChange = (lineId: string, newRating: number) => {
    setItemRatings((prev) => ({
      ...prev,
      [lineId]: {
        ...(prev[lineId] || { comment: '', tags: [] }),
        rating: newRating,
      },
    }));
  };

  const handleTagToggle = (lineId: string, tag: string) => {
    setItemRatings((prev) => {
      const cur = prev[lineId] || { rating: 5, comment: '', tags: [] };
      const exists = cur.tags.includes(tag);
      const newTags = exists ? cur.tags.filter((t) => t !== tag) : [...cur.tags, tag];
      return {
        ...prev,
        [lineId]: {
          ...cur,
          tags: newTags,
        },
      };
    });
  };

  const handleCommentChange = (lineId: string, comment: string) => {
    setItemRatings((prev) => ({
      ...prev,
      [lineId]: {
        ...(prev[lineId] || { rating: 5, tags: [] }),
        comment,
      },
    }));
  };

  const isOrderReviewed = Boolean(
    order?.reviewedAt || order?.lines.some((l) => l.rating && l.rating > 0),
  );

  // Auto-pop up rating sheet when order is marked SERVED
  useEffect(() => {
    if (order?.status === 'SERVED' && !isOrderReviewed && !ratingPromptDismissed) {
      const timer = setTimeout(() => {
        setFeedbackOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [order?.status, isOrderReviewed, ratingPromptDismissed]);

  const handleSubmitItemReviews = async () => {
    if (!order) return;
    await actions.submitOrderReview(order.id, itemRatings, overallFeedback);
    setIsEditingReview(false);
    toast('Thank you for rating your dishes! Feedback saved.', 'success');
  };

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
                Placed {clockTime(order.createdAt)}
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

            {!isCancelled && order.status === 'SERVED' && (
              <button
                type="button"
                onClick={() => setFeedbackOpen(true)}
                className="mt-4 flex w-full items-center justify-between rounded-2xl bg-amber-500/20 border border-amber-400/40 px-4 py-2.5 text-[12px] font-bold text-amber-200 transition hover:bg-amber-500/30 active:scale-[0.98]"
              >
                <span className="flex items-center gap-1.5">
                  <Star size={15} className="fill-amber-400 text-amber-400" />
                  {isOrderReviewed ? '✓ Dishes Rated · View Review' : '🍽️ Food Served! Tap to Rate Dishes'}
                </span>
                <span className="rounded-lg bg-amber-400 px-2 py-0.5 text-[11px] font-black text-stone-950">
                  {isOrderReviewed ? 'View' : 'Rate ★'}
                </span>
              </button>
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
                    : `Your order is confirmed! Enjoy your food at Table ${order.tableCode}. Please settle your bill at the counter when you leave.`}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackOpen(true)}
                    className="rounded-xl border border-amber-400 bg-amber-50/90 px-3.5 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-100 active:scale-95 flex items-center gap-1.5 shadow-xs cursor-pointer"
                    title="Give feedback & visit our channels"
                  >
                    <Star size={14} className="fill-amber-500 text-amber-500" />
                    <span>Feedback &amp; Channels</span>
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
              Pay at the counter when you leave
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
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 py-3.5 text-xs font-black shadow-md shadow-amber-500/20 transition active:scale-[0.98]"
          >
            <Star size={16} className="fill-stone-950 text-stone-950" />
            <span>{isOrderReviewed ? 'View / Edit Dish Ratings' : '⭐ Rate The Dishes You Enjoyed'}</span>
          </button>
        </div>
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

      {/* Dish Rating & Review Modal (Popup) */}
      <Sheet
        open={feedbackOpen}
        onClose={handleCloseFeedback}
        title={isOrderReviewed && !isEditingReview ? 'Dish Ratings & Review' : 'Rate The Dishes You Enjoyed'}
      >
        <div className="max-h-[82vh] overflow-y-auto px-4 py-4 space-y-4">
          {/* Header Banner */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-500/5 p-4 border border-amber-500/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-500 text-stone-950 font-bold shadow-xs">
                <Star size={20} className="fill-stone-950" />
              </div>
              <div className="min-w-0">
                <h4 className="font-display text-[15px] font-bold text-stone-900 leading-tight">
                  {isOrderReviewed && !isEditingReview
                    ? 'Your Dish Reviews & Feedback'
                    : 'Rate The Dishes You Enjoyed'}
                </h4>
                <p className="text-[11px] text-stone-600 truncate">
                  {isOrderReviewed && !isEditingReview
                    ? 'Thank you! Your ratings help our chefs and diners.'
                    : `How was your food at Table ${order.tableCode}?`}
                </p>
              </div>
            </div>
            {isOrderReviewed && !isEditingReview && (
              <button
                type="button"
                onClick={() => setIsEditingReview(true)}
                className="shrink-0 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-[11px] font-bold text-stone-800 shadow-xs hover:bg-stone-50 active:scale-95 transition"
              >
                Edit Ratings
              </button>
            )}
          </div>

          {/* If already reviewed and not editing: show reviewed summary */}
          {isOrderReviewed && !isEditingReview ? (
            <div className="space-y-3">
              {order.lines.map((l) => {
                const r = l.rating || itemRatings[l.lineId]?.rating || 5;
                const comment = l.reviewComment || itemRatings[l.lineId]?.comment;
                const tags = l.reviewTags || itemRatings[l.lineId]?.tags || [];

                return (
                  <div
                    key={l.lineId}
                    className="rounded-2xl border border-stone-200/80 bg-white p-3 shadow-xs space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={l.image}
                        alt={l.name}
                        className="h-12 w-12 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-stone-900 truncate">
                          {l.qty} × {l.name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              className={
                                star <= r
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'text-stone-200'
                              }
                            />
                          ))}
                          <span className="ml-1 text-[11px] font-bold text-amber-800">
                            {r} / 5
                          </span>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0">
                        Reviewed ✓
                      </span>
                    </div>

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-stone-100">
                        {tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-lg bg-amber-50 px-2 py-0.5 text-[10.5px] font-medium text-amber-900 border border-amber-200/60"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {comment && (
                      <p className="text-[11.5px] text-stone-600 bg-stone-50 rounded-xl p-2 italic border border-stone-200">
                        "{comment}"
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Social Channels & Google Maps */}
              <div className="space-y-2.5 pt-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Share your review online
                </p>

                {/* Google Maps Review */}
                <a
                  href={GOOGLE_MAPS_REVIEW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    toast('Opening Google Maps for review. Thank you!', 'success');
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white border-2 border-amber-400 hover:border-amber-500 hover:bg-amber-50/20 shadow-xs transition active:scale-[0.98] group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-xs border border-stone-200 shrink-0">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black text-stone-900 group-hover:text-blue-600 flex items-center gap-1.5">
                        Post Review on Google Maps
                        <ExternalLink size={12} className="text-stone-400" />
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Help others find delicious dishes at Ivan Food Court
                      </p>
                    </div>
                  </div>
                  <span className="rounded-xl bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-stone-950 shrink-0 shadow-xs">
                    Review ★
                  </span>
                </a>

                {/* Facebook Channel Card */}
                <a
                  href={FACEBOOK_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-200 hover:border-blue-300 transition active:scale-[0.98] group shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#1877F2] text-white shrink-0 shadow-xs">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-stone-900 group-hover:text-[#1877F2] flex items-center gap-1">
                        Visit Our Facebook Channel
                        <ExternalLink size={11} className="text-stone-400" />
                      </p>
                      <p className="text-[10.5px] text-stone-500">
                        Follow us for special offers &amp; updates
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 text-[11px] font-bold shrink-0">
                    Follow
                  </span>
                </a>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCloseFeedback}
                  className="w-full rounded-2xl bg-stone-900 hover:bg-stone-800 text-white py-3 text-xs font-bold shadow-xs transition active:scale-[0.98]"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Interactive Dish Rating Form */
            <div className="space-y-3.5">
              {order.lines.map((l) => {
                const curRating = itemRatings[l.lineId]?.rating ?? 5;
                const curComment = itemRatings[l.lineId]?.comment ?? '';
                const curTags = itemRatings[l.lineId]?.tags ?? [];

                return (
                  <div
                    key={l.lineId}
                    className="rounded-2xl border border-stone-200/90 bg-white p-3.5 shadow-xs space-y-3"
                  >
                    {/* Item Info & Stars */}
                    <div className="flex items-start gap-3">
                      <img
                        src={l.image}
                        alt={l.name}
                        className="h-14 w-14 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-bold text-stone-900 leading-tight">
                          {l.qty} × {l.name}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Tap stars to rate this dish:
                        </p>

                        {/* 5-Star Interactive Selector */}
                        <div className="flex items-center gap-1 mt-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleItemRatingChange(l.lineId, star)}
                              className="p-0.5 transition hover:scale-125 active:scale-95 focus:outline-none"
                              title={`${star} Star`}
                            >
                              <Star
                                size={22}
                                className={`${
                                  star <= curRating
                                    ? 'fill-amber-500 text-amber-500 drop-shadow-xs'
                                    : 'text-stone-300 hover:text-amber-300'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-1.5 text-xs font-black text-amber-800">
                            {curRating === 5
                              ? '5★ Loved it!'
                              : curRating === 4
                                ? '4★ Very good'
                                : curRating === 3
                                  ? '3★ Average'
                                  : `${curRating}★`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Sentiment Tags */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                        Quick tags:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_REVIEW_TAGS.map((tag) => {
                          const active = curTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleTagToggle(l.lineId, tag)}
                              className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition active:scale-95 ${
                                active
                                  ? 'bg-amber-500 text-stone-950 shadow-xs font-bold'
                                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80 border border-stone-200/60'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Optional Note */}
                    <div>
                      <input
                        type="text"
                        value={curComment}
                        onChange={(e) => handleCommentChange(l.lineId, e.target.value)}
                        placeholder="Short comment (e.g. Perfectly cooked, loved the dip)..."
                        className="w-full rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                );
              })}

              {/* Submit Ratings Button */}
              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={handleSubmitItemReviews}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#18392B] hover:bg-[#122A20] text-white py-3.5 text-xs font-bold shadow-md shadow-stone-900/10 transition active:scale-[0.98]"
                >
                  <Star size={15} className="fill-amber-400 text-amber-400" />
                  <span>Submit Dish Ratings ({order.lines.length} Items)</span>
                </button>

                {isEditingReview && (
                  <button
                    type="button"
                    onClick={() => setIsEditingReview(false)}
                    className="rounded-2xl border border-stone-300 bg-white px-4 py-3.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleCloseFeedback}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-800 transition text-center cursor-pointer"
                >
                  Maybe Later · Close
                </button>
              </div>
            </div>
          )}
        </div>
      </Sheet>
    </div>
  );
}
