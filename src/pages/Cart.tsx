import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  Minus,
  NotebookPen,
  Plus,
  ShoppingBag,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { cart, useCart } from '../lib/cart';
import { actions, priceOrder, useSettings, useTables } from '../lib/store';
import { money } from '../lib/format';
import { Button, EmptyState, Field, inputCx, useToast } from '../components/ui';
import type { Order } from '../lib/types';

const MODES: { id: Order['paymentMode']; label: string; icon: typeof Banknote; hint: string }[] = [
  {
    id: 'COUNTER',
    label: 'Pay After Meal (At Counter)',
    icon: Banknote,
    hint: 'Eat first, pay when you finish your meal',
  },
  {
    id: 'UPI',
    label: 'UPI / QR Code',
    icon: Smartphone,
    hint: 'Scan QR at table anytime during or after meal',
  },
  {
    id: 'CARD',
    label: 'Card on Table',
    icon: CreditCard,
    hint: 'Server brings wireless card machine to your table',
  },
];

export default function CartPage() {
  const [params] = useSearchParams();
  const table = (params.get('table') || '').toUpperCase();
  const lines = useCart(table);
  const settings = useSettings();
  const tables = useTables();
  const navigate = useNavigate();
  const toast = useToast();

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
    if (!settings.acceptingOrders) {
      toast('The kitchen is not accepting orders right now.', 'error');
      return;
    }
    setErrors({});
    setPlacing(true);
    await new Promise((r) => setTimeout(r, 750));
    const order = actions.placeOrder({
      tableCode: table,
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
          <p className="text-[11px] font-medium text-mocha">
            Table {table} {tableRow ? `· ${tableRow.label}` : ''}
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
              <h3 className="font-display text-[16px] font-semibold">Payment Option</h3>
              <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                Pay After Meal
              </span>
            </div>

            <div className="mb-3 rounded-2xl bg-[#F4F9F4] border border-emerald-200/80 p-3 flex items-start gap-2.5">
              <span className="text-xl">🍽️</span>
              <div>
                <p className="text-xs font-bold text-emerald-950">Eat First, Pay Later Guarantee</p>
                <p className="text-[11.5px] text-emerald-800 mt-0.5 leading-relaxed">
                  Your order will be instantly confirmed and sent straight to the kitchen. Enjoy your dining experience and settle your bill after eating!
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              {MODES.map((m) => {
                const Icon = m.icon;
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      active ? 'border-[#18392B] bg-[#18392B]/5' : 'border-line hover:border-mocha/40'
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-xl ${
                        active ? 'bg-[#18392B] text-white' : 'bg-cream-deep text-ink-soft'
                      }`}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-[14px] font-semibold">{m.label}</span>
                      <span className="block text-[11px] text-mocha">{m.hint}</span>
                    </span>
                    <span
                      className={`h-4 w-4 rounded-full border-2 ${active ? 'border-[#18392B] bg-[#18392B]' : 'border-line'}`}
                    />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[24px] border border-line/80 bg-paper p-4 shadow-card">
            <h3 className="mb-3 font-display text-[16px] font-semibold">Bill summary</h3>
            <dl className="space-y-2 text-[14px]">
              <Row label="Item total" value={money(totals.subtotal)} />
              <Row label={`Taxes (${settings.taxPercent}%)`} value={money(totals.taxAmount)} />
              {settings.serviceEnabled && (
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
            {placing ? 'Sending to kitchen…' : `Confirm Order (Pay Later) · ${money(totals.total)}`}
          </Button>
          <p className="mt-1.5 text-center text-[11px] text-mocha">
            Instant Confirmation • Eat first, pay after your meal at Table {table}
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
