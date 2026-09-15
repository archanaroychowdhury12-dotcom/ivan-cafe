import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Heart, Minus, Plus, Settings2, ShoppingCart, Star } from 'lucide-react';
import type { MenuItem } from '../../lib/types';
import { money } from '../../lib/format';

export function ItemCard({
  item,
  onOpen,
  onDirectAdd,
  onDirectRemove,
  inCart,
  index = 0,
}: {
  item: MenuItem;
  onOpen: () => void;
  onDirectAdd?: (qty: number) => void;
  onDirectRemove?: () => void;
  inCart: number;
  index?: number;
}) {
  const [qty, setQty] = useState(1);
  const [liked, setLiked] = useState(false);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.soldOut) return;
    if (item.addonGroups.length > 0 && item.addonGroups.some((g) => g.required)) {
      onOpen();
      return;
    }
    if (onDirectAdd) {
      onDirectAdd(qty);
    } else {
      onOpen();
    }
  };

  const handleMinusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inCart > 0 && onDirectRemove) {
      onDirectRemove();
    } else {
      setQty((q) => Math.max(1, q - 1));
    }
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inCart > 0 && onDirectAdd) {
      onDirectAdd(1);
    } else {
      setQty((q) => Math.min(20, q + 1));
    }
  };

  const isPopular =
    item.popular ||
    item.tags.some(
      (t) =>
        t.toLowerCase().includes('popular') ||
        t.toLowerCase().includes('bestseller') ||
        t.toLowerCase().includes('signature') ||
        t.toLowerCase().includes('special'),
    );

  const isNew = item.tags.some((t) => t.toLowerCase().includes('new') || t.toLowerCase().includes('large'));

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.2), ease: [0.22, 1, 0.36, 1] }}
      onClick={() => !item.soldOut && onOpen()}
      className={`group relative flex items-center justify-between gap-3 sm:gap-4 overflow-hidden rounded-[26px] border border-[#E9DAC8]/90 bg-[#FFFDF9] p-3 sm:p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 ${
        item.soldOut
          ? 'opacity-70'
          : 'cursor-pointer hover:border-amber-600/40 hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] active:scale-[0.99]'
      }`}
    >
      {/* LEFT: Golden-bordered Food Image (Matches Reference Image Exactly) */}
      <div className="relative shrink-0">
        <div className="relative h-[110px] w-[110px] sm:h-[118px] sm:w-[118px] overflow-hidden rounded-[20px] border-2 border-[#E5A93C] shadow-sm bg-[#F6EFE6]">
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
          />

          {/* Top-Left Badge inside Image */}
          {item.soldOut ? (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-stone-900/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-xs">
              Sold Out
            </span>
          ) : isPopular ? (
            <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-[#E5A93C] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
              <Star size={8} className="fill-white text-white" /> POPULAR
            </span>
          ) : isNew ? (
            <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-[#0D9488] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
              NEW
            </span>
          ) : null}

          {item.soldOut && (
            <div className="absolute inset-0 grid place-items-center bg-stone-950/65 text-center backdrop-blur-[1px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                Unavailable
              </span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Content Details (Matches Reference Image Exactly) */}
      <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch py-0.5">
        <div>
          {/* Title row with Favorite Heart icon */}
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="font-editorial text-[15px] sm:text-[16.5px] font-bold leading-tight text-stone-900 group-hover:text-amber-900 transition-colors">
              {item.name}
            </h3>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLiked(!liked);
              }}
              className="shrink-0 p-0.5 text-stone-300 hover:text-rose-500 transition-colors active:scale-90"
              aria-label="Add to favorites"
            >
              <Heart
                size={16}
                className={liked ? 'fill-rose-500 text-rose-500' : 'text-stone-300'}
              />
            </button>
          </div>

          {/* Description */}
          <p className="mt-1 line-clamp-2 text-[11px] sm:text-[11.5px] leading-relaxed text-stone-500">
            {item.description}
          </p>

          {/* Tag Pills & Customise */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {item.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600 border border-stone-200/50"
              >
                {t}
              </span>
            ))}

            {item.addonGroups.length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold text-[#D97706]">
                <Settings2 size={11} /> Customise
              </span>
            )}
          </div>
        </div>

        {/* Bottom Row: Price, Prep Time, Stepper, ADD TO CART */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-100">
          {/* Price & Prep Time */}
          <div>
            <span className="font-display text-[17px] sm:text-[18.5px] font-black text-stone-900 leading-none">
              {money(item.price)}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-medium text-stone-500 mt-0.5">
              <Clock size={10} className="text-stone-400" />
              <span>{item.prepMins} min</span>
            </div>
          </div>

          {/* Right Action: Stepper & ADD TO CART button */}
          <div className="flex items-center gap-1.5">
            {/* Quantity Stepper Pill */}
            {!item.soldOut && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 rounded-full bg-[#F3EDE3] border border-[#E3D6C5] px-2 py-0.5 text-stone-800 shadow-2xs"
              >
                <button
                  type="button"
                  onClick={handleMinusClick}
                  className="grid h-5 w-5 place-items-center rounded-full hover:bg-stone-300/60 active:scale-90 text-stone-700 font-bold transition"
                  aria-label="Decrease quantity"
                >
                  <Minus size={11} strokeWidth={2.5} />
                </button>
                <span className="min-w-[14px] text-center font-display text-[11.5px] font-bold text-stone-900">
                  {inCart > 0 ? inCart : qty}
                </span>
                <button
                  type="button"
                  onClick={handlePlusClick}
                  className="grid h-5 w-5 place-items-center rounded-full hover:bg-stone-300/60 active:scale-90 text-stone-700 font-bold transition"
                  aria-label="Increase quantity"
                >
                  <Plus size={11} strokeWidth={2.5} />
                </button>
              </div>
            )}

            {/* ADD TO CART Button */}
            {!item.soldOut ? (
              <button
                type="button"
                onClick={handleAddClick}
                className="flex items-center gap-1.5 rounded-full bg-[#18392B] hover:bg-[#122A20] text-white px-3 py-1.5 text-[10.5px] font-extrabold uppercase tracking-wider shadow-sm transition active:scale-95"
              >
                <ShoppingCart size={12} strokeWidth={2.2} />
                <span>ADD TO CART</span>
              </button>
            ) : (
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400 py-1">
                Sold Out
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function KitchenDisplayCard({
  item,
  onOpen,
}: {
  item: MenuItem;
  onOpen: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-[#EADECE]/90 bg-gradient-to-br from-white to-[#FDFBF7] p-4 shadow-[0_6px_24px_rgba(40,25,15,0.06)]">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-7 flex gap-3.5">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[20px] border-2 border-[#E5A93C] bg-[#F2EAE0] shadow-sm">
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#E5A93C] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow">
              <Star size={9} className="fill-white text-white" /> SPECIAL
            </div>
          </div>

          <div className="flex flex-col justify-between py-0.5">
            <div>
              <h4 className="font-editorial text-[16px] font-bold text-stone-900 leading-tight">
                {item.name}
              </h4>
              <p className="mt-1 line-clamp-2 text-[12px] text-stone-600 leading-relaxed">
                {item.description}
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-display text-[17px] font-black text-stone-900">
                {money(item.price)}
              </span>
              <button
                onClick={onOpen}
                className="rounded-full bg-[#18392B] px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white transition hover:bg-[#122A20] active:scale-95 shadow-sm"
              >
                Order Now
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-5 flex flex-col justify-center">
          <div className="relative overflow-hidden rounded-2xl border border-stone-800 shadow-md">
            <img
              src="/brand/kds_widget_exact.jpg"
              alt="Kitchen Display Ticket"
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="mt-2 flex items-center justify-between rounded-xl bg-stone-900 px-3 py-1.5 text-[10.5px] font-mono text-stone-300 shadow-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE KITCHEN TICKET</span>
            </span>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 font-bold uppercase text-amber-300 text-[9.5px]">
              PREPARING
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeatureCard({ item, onOpen }: { item: MenuItem; onOpen: () => void }) {
  return (
    <button
      onClick={() => !item.soldOut && onOpen()}
      className="group relative w-[240px] shrink-0 overflow-hidden rounded-[24px] border border-[#EADECE]/80 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative h-[136px] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-950/15 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#E5A93C] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white shadow">
          <Star size={9} className="fill-white" /> Bestseller
        </span>
        <div className="absolute inset-x-3 bottom-2.5">
          <p className="font-editorial text-[15px] font-bold leading-tight text-cream drop-shadow">
            {item.name}
          </p>
        </div>
        {item.soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-stone-950/70">
            <span className="text-xs font-bold uppercase tracking-widest text-cream">Sold out</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-3.5 py-2.5">
        <div>
          <p className="font-display text-[15px] font-bold text-stone-900">{money(item.price)}</p>
          <p className="text-[10.5px] font-medium text-stone-500">{item.prepMins} min</p>
        </div>
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#18392B] text-white transition-transform duration-200 group-hover:rotate-90">
          <Plus size={15} strokeWidth={2.5} />
        </span>
      </div>
    </button>
  );
}
