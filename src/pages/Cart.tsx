import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Banknote,
  Minus,
  NotebookPen,
  PackageCheck,
  Plus,
  ShoppingBag,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { cart, useCart } from '../lib/cart';
import { actions, priceOrder, useSettings, useTables } from '../lib/store';
import { money } from '../lib/format';
import { Button, EmptyState, Field, inputCx, useToast } from '../components/ui';
import type { Order } from '../lib/types';

export default function CartPage() {
  const [params] = useSearchParams();
  const table = (params.get('table') || '').toUpperCase();
  const lines = useCart(table);
  const settings = useSettings();
  const tables = useTables();
  const navigate = useNavigate();
  const toast = useToast();

  const [diningMode, setDiningMode] = useState<'Dine-in' | 'Takeaway'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ivan-dining-mode');
      if (saved === 'Takeaway' || saved === 'Dine-in') return saved;
    }
    return 'Dine-in';
  });

  const selectDiningMode = (mode: 'Dine-in' | 'Takeaway') => {
    setDiningMode(mode);
    try {
      localStorage.setItem('ivan-dining-mode', mode);
    } catch {}
    if (mode === 'Takeaway') {
      toast('🛍️ Order set to Takeaway (Parcel)', 'info');
    } else {
      toast(`🍽️ Order set to Dine-in (Table ${table})`, 'info');
    }
  };

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<Order['paymentMode']>('COUNTER');
  const [placing, setPlacing] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string }>({});

  const totals = priceOrder(lines, settings);
  const tableRow = tables.find((t) => t.code === table);

  const place = async () => {
    if (phone && !/^[0-9+\-\s]{7,15}$/.test(phone)) {
      setErrors({ phone: 'Enter a valid phone number or leave it blank.' });
      return;
    }
    setErrors({});
    setPlacing(true);
    await new Promise((r) => setTimeout(r, 750));
    const order = actions.placeOrder({
      tableCode: table,
      diningMode,
      lines,
      customerName: name,
      customerPhone: phone || undefined,
      note: note.trim() || undefined,
      paymentMode: mode,
    });
    cart.clear(table);
    setPlacing(false);
    navigate(`/order/${order.code}`, { replace: true });
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-40">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line/70 bg-cream/90 px-4 py-3.5 backdrop-blur-lg">
        <Link
          to={`/menu?table=${table}`}
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-paper transition active:scale-90"
          aria-label="Back to menu"
        >
          <ArrowLeft size={17} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-[19px] font-semibold leading-tight">Your tray</h1>
          <p className="text-[11px] font-medium text-mocha flex items-center gap-1.5">
            {diningMode === 'Takeaway' ? (
              <span className="font-bold text-amber-700">🛍️ Takeaway / Parcel Order</span>
            ) : (
              <span>🍽️ Table {table} {tableRow ? `· ${tableRow.label}` : ''}</span>
            )}
          </p>
        </div>
        {lines.length > 0 && (
          <button
            onClick={() => {
              cart.clear(table);
              toast('Tray cleared', 'info');
            }}
            className="text-[12px] font-bold uppercase tracking-[0.08em] text-berry"
          >
            Clear
          </button>
        )}
      </header>

      {lines.length === 0 ? (
        <div className="px-4 pt-10">
          <EmptyState
            icon={<ShoppingBag size={22} />}
            title="Your tray is empty"
            sub="Add something warm from the menu — the kitchen is ready when you are."
            action={
              <Link to={`/menu?table=${table}`}>
                <Button size="sm">Browse the menu</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-5 px-4 pt-4">
          {/* Order Type Selection: Dine-in vs Takeaway */}
          <section className="overflow-hidden rounded-[24px] border border-line/80 bg-paper p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-display text-[16px] font-bold text-ink flex items-center gap-2">
                  <UtensilsCrossed size={16} className="text-ember" /> How do you want this order?
                </h3>
                <p className="text-[11.5px] text-mocha mt-0.5">
                  Choose whether to eat at the cafe or take it home
                </p>
              </div>
              <span className={`rounded-full text-[10.5px] font-extrabold px-2.5 py-0.5 uppercase tracking-wide ${
                diningMode === 'Takeaway' ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {diningMode === 'Takeaway' ? '🛍️ Parcel' : '🍽️ Dine-in'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => selectDiningMode('Dine-in')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer ${
                  diningMode === 'Dine-in'
                    ? 'border-[#18392B] bg-[#18392B]/10 ring-2 ring-[#18392B] shadow-xs'
                    : 'border-line/70 hover:border-mocha/40 bg-cream/30'
                }`}
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-800 mb-1.5 shadow-2xs">
                  <UtensilsCrossed size={20} strokeWidth={2.2} />
                </div>
                <span className="text-[13.5px] font-bold text-ink leading-tight">Dine-in</span>
                <span className="text-[11px] text-mocha mt-0.5 font-medium">Table {table}</span>
              </button>

              <button
                type="button"
                onClick={() => selectDiningMode('Takeaway')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer ${
                  diningMode === 'Takeaway'
                    ? 'border-[#C2571F] bg-orange-50 ring-2 ring-[#C2571F] shadow-xs'
                    : 'border-line/70 hover:border-mocha/40 bg-cream/30'
                }`}
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-100 text-orange-800 mb-1.5 shadow-2xs">
                  <ShoppingBag size={20} strokeWidth={2.2} />
                </div>
                <span className="text-[13.5px] font-bold text-ink leading-tight">Takeaway</span>
                <span className="text-[11px] text-mocha mt-0.5 font-medium">Parcel / Pack to go</span>
              </button>
            </div>

            {diningMode === 'Takeaway' ? (
              <div className="mt-3 rounded-xl bg-orange-50 border border-orange-200/80 p-3 flex items-start gap-2 text-[12px] text-orange-950">
                <PackageCheck size={17} className="text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Takeaway / Parcel Packed Fresh</p>
                  <p className="text-[11.5px] text-orange-900 mt-0.5 leading-relaxed">
                    The kitchen will pack your food in takeaway containers. Pick up your parcel at the counter when called!
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 p-2.5 flex items-center gap-2 text-[12px] text-emerald-950">
                <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                <span>Food will be served hot directly to <strong>Table {table}</strong>.</span>
              </div>
            )}
          </section>

          <section className="space-y-3">
            {lines.map((l, idx) => (
              <motion.div
                key={l.lineId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="overflow-hidden rounded-[24px] border border-line/80 bg-paper shadow-card"
              >
                <div className="flex gap-3.5 p-3.5">
                  <img
                    src={l.image}
                    alt={l.name}
                    className="h-[86px] w-[86px] shrink-0 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-[16px] font-semibold leading-snug">{l.name}</h3>
                      <button
                        onClick={() => cart.remove(table, l.lineId)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-mocha transition hover:bg-berry/10 hover:text-berry"
                        aria-label="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {l.addons.length > 0 && (
                      <p className="mt-0.5 text-[12px] leading-relaxed text-mocha">
                        {l.addons.map((a) => a.optionName).join(' · ')}
                      </p>
                    )}
                    {l.note && (
                      <p className="mt-1 inline-flex items-start gap-1 rounded-lg bg-gold/10 px-2 py-1 text-[11px] font-medium text-[#8a6a1f]">
                        <NotebookPen size={11} className="mt-0.5 shrink-0" />
                        {l.note}
                      </p>
                    )}
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-xl border border-line bg-cream/60 px-1 py-1">
                        <button
                          onClick={() => cart.setQty(table, l.lineId, l.qty - 1)}
                          className="grid h-7 w-7 place-items-center rounded-lg transition hover:bg-paper active:scale-90"
                          aria-label="Decrease"
                        >
                          <Minus size={13} strokeWidth={3} />
                        </button>
                        <span className="w-6 text-center text-[14px] font-bold">{l.qty}</span>
                        <button
                          onClick={() => cart.setQty(table, l.lineId, Math.min(20, l.qty + 1))}
                          className="grid h-7 w-7 place-items-center rounded-lg transition hover:bg-paper active:scale-90"
                          aria-label="Increase"
                        >
                          <Plus size={13} strokeWidth={3} />
                        </button>
                      </div>
                      <span className="font-display text-[16px] font-semibold">
                        {money(l.unitPrice * l.qty)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            <Link
              to={`/menu?table=${table}`}
              className="block rounded-2xl border border-dashed border-line bg-paper/60 py-3 text-center text-[13px] font-bold text-ember transition hover:border-ember"
            >
              + Add more items
            </Link>
          </section>

          <section className="rounded-[24px] border border-line/80 bg-paper p-4 shadow-card">
            <h3 className="mb-3 font-display text-[16px] font-semibold">Who is this for?</h3>
            <div className="grid gap-3">
              <Field label="Name" hint="optional">
                <input
                  className={inputCx}
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 40))}
                  placeholder="Guest"
                />
              </Field>
              <Field label="Phone" hint="optional" error={errors.phone}>
                <input
                  className={inputCx}
                  value={phone}
                  inputMode="tel"
                  onChange={(e) => setPhone(e.target.value.slice(0, 15))}
                  placeholder="For order updates"
                />
              </Field>
              <Field label="Note for the kitchen" hint="optional">
                <textarea
                  rows={2}
                  className={`${inputCx} resize-none`}
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 200))}
                  placeholder="Allergies, serving order, birthday candle…"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-[24px] border border-line/80 bg-paper p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-[16px] font-semibold">Payment Method</h3>
              <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                Pay After Meal
              </span>
            </div>

            <div className="rounded-2xl bg-[#F4F9F4] border border-emerald-200/80 p-3.5 flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                <Banknote size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-950">Pay at Counter (After Meal)</p>
                <p className="text-[12px] text-emerald-800 mt-0.5 leading-relaxed">
                  Your order is sent straight to the kitchen and automatically confirmed. Settle in cash, UPI or card at the counter anytime during or after your meal.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-line/80 bg-paper p-4 shadow-card">
            <h3 className="mb-3 font-display text-[16px] font-semibold">Bill summary</h3>
            <dl className="space-y-2 text-[14px]">
              <Row label="Item total" value={money(totals.subtotal)} />
              {settings.taxEnabled && settings.taxPercent > 0 && totals.taxAmount > 0 && (
                <Row label={`Taxes (${settings.taxPercent}%)`} value={money(totals.taxAmount)} />
              )}
              {settings.serviceEnabled && settings.servicePercent > 0 && totals.serviceAmount > 0 && (
                <Row
                  label={`Service charge (${settings.servicePercent}%)`}
                  value={money(totals.serviceAmount)}
                />
              )}
              <div className="!mt-3 border-t border-dashed border-line pt-3">
                <Row label="Total to pay after meal" value={money(totals.total)} strong />
              </div>
            </dl>
          </section>
        </div>
      )}

      {lines.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-line/70 bg-paper/95 px-4 py-3 backdrop-blur-lg safe-bottom">
          <Button full size="lg" loading={placing} onClick={place}>
            {placing
              ? 'Sending straight to kitchen…'
              : diningMode === 'Takeaway'
                ? `Send to Kitchen (Takeaway) · ${money(totals.total)} 🛍️`
                : `Send to Kitchen (Table ${table}) · ${money(totals.total)} 🍽️`}
          </Button>
          <p className="mt-1.5 text-center text-[11px] text-mocha">
            {diningMode === 'Takeaway'
              ? '⚡ Direct to Kitchen • Chef starts cooking immediately • Collect at Counter'
              : `⚡ Direct to Kitchen • Chef starts cooking immediately for Table ${table}`}
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={strong ? 'font-display text-[17px] font-semibold' : 'text-mocha'}>{label}</dt>
      <dd className={strong ? 'font-display text-[19px] font-semibold' : 'font-semibold text-ink'}>
        {value}
      </dd>
    </div>
  );
}
