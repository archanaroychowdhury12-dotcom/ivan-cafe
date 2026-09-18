import { useState } from 'react';
import { Check, Minus, Plus, Star, Timer } from 'lucide-react';
import type { CartLine, MenuItem, ItemRatingStats } from '../../lib/types';
import { money, uid } from '../../lib/format';
import { Button, Sheet } from '../ui';

export function ItemSheet({
  item,
  open,
  onClose,
  onAdd,
  ratingStats,
}: {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
  onAdd: (line: CartLine) => void;
  ratingStats?: ItemRatingStats;
}) {
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);

  const key = (item?.id ?? 'none') + String(open);
  const [prevKey, setPrevKey] = useState(key);
  if (key !== prevKey) {
    // reset the configurator whenever a different item is opened
    const defaults: Record<string, string[]> = {};
    item?.addonGroups.forEach((g) => {
      defaults[g.id] = g.type === 'single' && g.required ? [g.options[0].id] : [];
    });
    setPrevKey(key);
    setSel(defaults);
    setQty(1);
    setNote('');
    setTouched(false);
  }

  if (!item) return null;

  const chosen = item.addonGroups.flatMap((g) =>
    (sel[g.id] ?? []).map((oid) => {
      const o = g.options.find((x) => x.id === oid)!;
      return { groupName: g.name, optionName: o.name, price: o.price };
    }),
  );
  const unitPrice = item.price + chosen.reduce((s, a) => s + a.price, 0);
  const missing = item.addonGroups.filter((g) => g.required && (sel[g.id] ?? []).length === 0);

  const toggle = (gid: string, oid: string, type: 'single' | 'multi') => {
    setSel((prev) => {
      const cur = prev[gid] ?? [];
      if (type === 'single') return { ...prev, [gid]: [oid] };
      return {
        ...prev,
        [gid]: cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid],
      };
    });
  };

  const submit = () => {
    setTouched(true);
    if (missing.length) return;
    onAdd({
      lineId: uid('l_'),
      itemId: item.id,
      name: item.name,
      image: item.image,
      basePrice: item.price,
      unitPrice,
      qty,
      addons: chosen,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="relative h-48 shrink-0 overflow-hidden sm:h-56">
        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-paper/90 text-ink backdrop-blur transition hover:bg-paper"
          aria-label="Close"
        >
          ✕
        </button>
        <div className="absolute inset-x-5 bottom-4">
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-paper/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-cream backdrop-blur"
              >
                {t}
              </span>
            ))}
          </div>
          <h2 className="mt-2 font-display text-2xl font-semibold text-cream">{item.name}</h2>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-4">
        <p className="text-[14px] leading-relaxed text-ink-soft">{item.description}</p>
        <div className="mt-3 flex items-center gap-3 text-[12px] font-semibold text-mocha">
          <span className="inline-flex items-center gap-1">
            <Timer size={13} /> Ready in ~{item.prepMins} min
          </span>
          <span className="h-3 w-px bg-line" />
          <span>{item.veg ? 'Vegetarian' : 'Non-vegetarian'}</span>
        </div>

        {ratingStats && ratingStats.totalReviews > 0 && (
          <div className="mt-3.5 rounded-2xl bg-[#FFFDF7] border border-amber-300/70 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star size={17} className="fill-amber-500" />
                  <span className="font-display text-lg font-bold text-stone-900">
                    {ratingStats.averageRating}
                  </span>
                  <span className="text-[11px] text-stone-500 font-medium">/ 5.0</span>
                </div>
                <span className="text-xs text-stone-500 font-medium">
                  ({ratingStats.totalReviews} reviews)
                </span>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5">
                {ratingStats.satisfactionPercent}% Loved This
              </span>
            </div>

            {/* If recent customer quotes exist, show snippet */}
            {ratingStats.recentReviews.some((r) => r.comment) && (
              <div className="mt-2 pt-2 border-t border-amber-200/50 text-[11.5px] text-stone-700 italic">
                "{ratingStats.recentReviews.find((r) => r.comment)?.comment}"
                <span className="not-italic text-[10px] text-stone-400 ml-1.5 font-medium">
                  — {ratingStats.recentReviews.find((r) => r.comment)?.customerName}
                </span>
              </div>
            )}
          </div>
        )}

        {item.addonGroups.map((g) => {
          const isMissing = touched && g.required && (sel[g.id] ?? []).length === 0;
          return (
            <section key={g.id} className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-display text-[15px] font-semibold text-ink">{g.name}</h4>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
                    isMissing ? 'bg-berry/10 text-berry' : 'bg-cream-deep text-mocha'
                  }`}
                >
                  {g.required ? 'Required' : g.type === 'multi' ? 'Optional · multi' : 'Optional'}
                </span>
              </div>
              <div className="grid gap-2">
                {g.options.map((o) => {
                  const active = (sel[g.id] ?? []).includes(o.id);
                  return (
                    <button
                      key={o.id}
                      onClick={() => toggle(g.id, o.id, g.type)}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all duration-200 active:scale-[0.99] ${
                        active
                          ? 'border-ember bg-ember-soft/70 shadow-[0_0_0_3px_rgba(194,87,31,0.08)]'
                          : 'border-line bg-paper hover:border-mocha/40'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`grid h-5 w-5 place-items-center border-2 transition ${
                            g.type === 'single' ? 'rounded-full' : 'rounded-md'
                          } ${active ? 'border-ember bg-ember text-white' : 'border-line'}`}
                        >
                          {active && <Check size={12} strokeWidth={4} />}
                        </span>
                        <span className="text-[14px] font-medium text-ink">{o.name}</span>
                      </span>
                      <span className={`text-[13px] font-semibold ${o.price ? 'text-ink' : 'text-mocha'}`}>
                        {o.price ? `+ ${money(o.price)}` : 'Free'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        <section className="mt-5">
          <h4 className="mb-2 font-display text-[15px] font-semibold text-ink">Special instructions</h4>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 160))}
            rows={2}
            placeholder="e.g. less ice, no onions, serve after mains…"
            className="w-full resize-none rounded-2xl border border-line bg-cream/50 px-4 py-3 text-[14px] outline-none transition placeholder:text-mocha/60 focus:border-ember focus:bg-paper focus:ring-4 focus:ring-ember/10"
          />
          <p className="mt-1 text-right text-[11px] text-mocha">{note.length}/160</p>
        </section>
      </div>

      <div className="shrink-0 border-t border-line bg-paper px-5 py-4 safe-bottom">
        {touched && missing.length > 0 && (
          <p className="mb-2 text-center text-[12px] font-semibold text-berry">
            Please choose: {missing.map((m) => m.name).join(', ')}
          </p>
        )}
        <div className="flex items-center gap-3">
          <div className="flex h-14 items-center gap-1 rounded-2xl border border-line bg-cream/60 px-2">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="grid h-10 w-10 place-items-center rounded-xl text-ink transition hover:bg-paper active:scale-90"
              aria-label="Decrease"
            >
              <Minus size={16} strokeWidth={3} />
            </button>
            <span className="w-7 text-center font-display text-lg font-semibold">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(20, q + 1))}
              className="grid h-10 w-10 place-items-center rounded-xl text-ink transition hover:bg-paper active:scale-90"
              aria-label="Increase"
            >
              <Plus size={16} strokeWidth={3} />
            </button>
          </div>
          <Button size="lg" full onClick={submit} className="flex-1">
            Add item · {money(unitPrice * qty)}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
