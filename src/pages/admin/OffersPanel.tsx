import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Coffee,
  Flame,
  HelpCircle,
  Image as ImageIcon,
  Megaphone,
  Percent,
  RefreshCw,
  Save,
  Sparkles,
  Tag,
  UtensilsCrossed,
} from 'lucide-react';
import { actions, useCategories, useSettings } from '../../lib/store';
import type { PromoOffer } from '../../lib/types';
import { defaultPromoOffer } from '../../lib/seed';
import { Button, Toggle, inputCx, useToast } from '../../components/ui';

const PRESET_OFFERS: { name: string; icon: string; data: PromoOffer }[] = [
  {
    name: '☕ 20% Off on Coffee (Screenshot Match)',
    icon: '☕',
    data: {
      enabled: true,
      tag: "Today's Special",
      title: 'Enjoy 20% Off on Coffee',
      subtitle: 'Because good vibes taste better with coffee!',
      buttonText: 'View Menu →',
      image: '/brand/promo_coffee_offer.jpg',
      targetCategory: 'c-coffee',
      discountPercent: 20,
    },
  },
  {
    name: '🍗 Crispy Chicken Snacks Combo',
    icon: '🍗',
    data: {
      enabled: true,
      tag: "Chef's Choice",
      title: '15% Off on Hot Chicken Snacks',
      subtitle: 'Crispy chicken popcorn & fries to make your day!',
      buttonText: 'Explore Snacks →',
      image: '/brand/chicken_snacks_hero.jpg',
      targetCategory: 'c-chicken-snacks',
      discountPercent: 15,
    },
  },
  {
    name: '🍵 Special Malai Cha & Bites',
    icon: '🍵',
    data: {
      enabled: true,
      tag: 'Morning Special',
      title: 'Special Malai Cha Combo',
      subtitle: 'Brewed fresh with rich clotted cream and traditional aroma!',
      buttonText: 'Order Chai →',
      image: '/menu/malai_cha_hd.jpg',
      targetCategory: 'c-tea',
      discountPercent: 10,
    },
  },
  {
    name: '🍲 Chinese Sizzler Feast',
    icon: '🍲',
    data: {
      enabled: true,
      tag: 'Limited Time Deal',
      title: 'Get Free Beverage with Sizzlers',
      subtitle: 'Order any Chinese Sizzler or Fried Rice bowl today!',
      buttonText: 'View Meals →',
      image: '/menu/chinese_sizzler_hd.jpg',
      targetCategory: 'c-rice',
      discountPercent: 25,
    },
  },
];

const PRESET_IMAGES = [
  { label: 'Cold Coffee Frappe', url: '/brand/promo_coffee_offer.jpg' },
  { label: 'Iced Frappe Glass', url: '/menu/frappe.jpg' },
  { label: 'Hot Cappuccino', url: '/menu/cappuccino.jpg' },
  { label: 'Creamy Malai Cha', url: '/menu/malai_cha_hd.jpg' },
  { label: 'Chicken Popcorn & Snacks', url: '/brand/chicken_snacks_hero.jpg' },
  { label: 'Chinese Sizzler Platter', url: '/menu/chinese_sizzler_hd.jpg' },
  { label: 'Veg Pizza', url: '/menu/veg_pizza.jpg' },
  { label: 'Crispy Spring Rolls', url: '/menu/spring_roll.jpg' },
];

export default function OffersPanel() {
  const settings = useSettings();
  const categories = useCategories();
  const toast = useToast();

  const currentOffer: PromoOffer = settings.offer || defaultPromoOffer;
  const [draft, setDraft] = useState<PromoOffer>(currentOffer);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings.offer) {
      setDraft(settings.offer);
    }
  }, [settings.offer]);

  const handleSave = () => {
    actions.saveSettings({ offer: draft });
    setSaved(true);
    toast('Special offer updated successfully! Visible on customer menu.');
    setTimeout(() => setSaved(false), 2500);
  };

  const handleApplyPreset = (preset: PromoOffer) => {
    setDraft({ ...preset });
    toast(`Applied preset: "${preset.title}"`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#17110D] via-[#2A1D15] to-[#17110D] p-6 text-white shadow-xl border border-amber-900/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
              <Megaphone size={18} />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Special Offers & Promos
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                অফার সেকশন
              </span>
            </h2>
          </div>
          <p className="text-xs text-stone-300 max-w-xl">
            Control the promotional card displayed directly under the hero banner on the customer mobile menu.
            Customers can see the offer, discount and jump directly to the target category.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            draft.enabled
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-stone-800 text-stone-400 border-stone-700'
          }`}>
            <span className={`h-2 w-2 rounded-full ${draft.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
            {draft.enabled ? 'Offer Live on Menu' : 'Offer Hidden'}
          </div>

          <Button
            variant="primary"
            onClick={handleSave}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2"
          >
            {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saved ? 'Saved!' : 'Save & Publish'}
          </Button>
        </div>
      </div>

      {/* 2. LIVE PREVIEW: Customer View Card Mockup */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-600" />
            Live Customer Preview (Exact Menu Appearance)
          </label>
          <span className="text-[11px] text-stone-400">
            {draft.enabled ? '✓ Enabled' : '⚠ Currently disabled (hidden from customers)'}
          </span>
        </div>

        <div className={`rounded-3xl p-4 sm:p-6 transition-all ${draft.enabled ? 'bg-[#FAF6F0] border-2 border-amber-500/30 shadow-md' : 'bg-stone-100 opacity-60 border border-stone-200'}`}>
          {/* Card Mockup Matching media_1790151522458.jpg */}
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#F6F0E4] via-[#FDFBF7] to-[#F1E9D7] border border-[#E8DEC8] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              {/* Left Side: Icon & Details */}
              <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                {/* Megaphone Badge */}
                <div className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-2xl bg-[#ECD7B5]/60 border border-[#DEBE92] text-[#8C5E28] shrink-0 shadow-xs">
                  <Megaphone size={20} className="transform -rotate-12" />
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider text-[#A06C30] uppercase">
                      {draft.tag || "Today's Special"}
                    </span>
                    {draft.discountPercent ? (
                      <span className="rounded-full bg-[#E5A93C] text-white px-2 py-0.2 text-[9px] font-black">
                        {draft.discountPercent}% OFF
                      </span>
                    ) : null}
                  </div>

                  <h3 className="font-editorial text-[15px] sm:text-[18px] font-bold text-stone-900 leading-tight truncate">
                    {draft.title || 'Enjoy 20% Off on Coffee'}
                  </h3>

                  <p className="text-[11px] sm:text-[12px] text-stone-600 line-clamp-1">
                    {draft.subtitle || 'Because good vibes taste better with coffee!'}
                  </p>
                </div>
              </div>

              {/* Right Side: Product Thumbnail + Dark Pill Button */}
              <div className="flex items-center gap-2.5 shrink-0">
                {/* Coffee Frappe Thumbnail */}
                <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden bg-stone-900/10 border border-[#DEBE92]/50 shadow-inner">
                  <img
                    src={draft.image || '/brand/promo_coffee_offer.jpg'}
                    alt="Offer Item"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/brand/promo_coffee_offer.jpg';
                    }}
                  />
                </div>

                {/* Dark View Menu Button */}
                <button
                  type="button"
                  className="rounded-full bg-[#1A1816] hover:bg-stone-900 text-white px-3.5 sm:px-4 py-2 text-[11px] sm:text-[12px] font-semibold flex items-center gap-1 shadow-sm transition active:scale-95 cursor-default"
                >
                  <span>{draft.buttonText || 'View Menu →'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. One-Click Quick Presets */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-500" />
          Quick 1-Click Offer Templates
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_OFFERS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p.data)}
              className="text-left rounded-2xl border border-stone-200 bg-white p-3.5 hover:border-amber-500 hover:shadow-md transition active:scale-98 group cursor-pointer"
            >
              <div className="flex items-center gap-2 font-bold text-stone-900 text-xs group-hover:text-amber-700">
                <span className="text-base">{p.icon}</span>
                <span className="truncate">{p.name}</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">{p.data.subtitle}</p>
              <span className="mt-2 inline-block text-[10px] font-bold text-amber-600 group-hover:underline">
                Apply Template &rarr;
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Settings Form */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900">Offer Configuration</h3>
            <p className="text-xs text-stone-500">Edit any details of the promotional card below.</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-stone-700">
              {draft.enabled ? 'Banner Active' : 'Banner Disabled'}
            </span>
            <Toggle
              on={draft.enabled}
              onChange={(val) => setDraft({ ...draft, enabled: val })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Offer Tag */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
              Offer Eyebrow / Tag
            </label>
            <input
              type="text"
              value={draft.tag}
              onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
              placeholder="e.g. Today's Special, Weekend Deal, Monsoon Offer"
              className={inputCx}
            />
            <p className="text-[10.5px] text-stone-400 mt-1">Small highlight tag at top-left of the card.</p>
          </div>

          {/* Headline Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
              Main Headline Title
            </label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Enjoy 20% Off on Coffee"
              className={inputCx}
            />
            <p className="text-[10.5px] text-stone-400 mt-1">Primary title shown in bold.</p>
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
              Subtitle / Description
            </label>
            <input
              type="text"
              value={draft.subtitle}
              onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
              placeholder="e.g. Because good vibes taste better with coffee!"
              className={inputCx}
            />
            <p className="text-[10.5px] text-stone-400 mt-1">One-liner description encouraging the order.</p>
          </div>

          {/* Button Text */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
              Button Action Text
            </label>
            <input
              type="text"
              value={draft.buttonText}
              onChange={(e) => setDraft({ ...draft, buttonText: e.target.value })}
              placeholder="e.g. View Menu →, Order Now, Claim Offer"
              className={inputCx}
            />
            <p className="text-[10.5px] text-stone-400 mt-1">Text for the dark pill button.</p>
          </div>

          {/* Target Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
              Target Category to Open
            </label>
            <select
              value={draft.targetCategory || 'c-coffee'}
              onChange={(e) => setDraft({ ...draft, targetCategory: e.target.value })}
              className={inputCx}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
            <p className="text-[10.5px] text-stone-400 mt-1">
              When customer clicks the button, it automatically filters the menu to this category.
            </p>
          </div>

          {/* Discount Percentage */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
              Discount Percentage (Optional)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={draft.discountPercent || ''}
                onChange={(e) => setDraft({ ...draft, discountPercent: Number(e.target.value) || 0 })}
                placeholder="e.g. 20"
                className={inputCx}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 pointer-events-none">
                %
              </span>
            </div>
            <p className="text-[10.5px] text-stone-400 mt-1">Shows a badge e.g. "20% OFF". Leave 0 to hide.</p>
          </div>
        </div>

        {/* 5. Image Selector */}
        <div className="border-t border-stone-100 pt-5 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
            Promotional Image
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PRESET_IMAGES.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setDraft({ ...draft, image: img.url })}
                className={`relative flex items-center gap-2 p-2 rounded-xl border text-left transition active:scale-95 cursor-pointer ${
                  draft.image === img.url
                    ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.label}
                  className="h-10 w-10 rounded-lg object-cover shrink-0"
                />
                <span className="text-[11px] font-semibold text-stone-800 line-clamp-1">
                  {img.label}
                </span>
                {draft.image === img.url && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-600" />
                )}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">
              Or Custom Image URL
            </label>
            <input
              type="text"
              value={draft.image}
              onChange={(e) => setDraft({ ...draft, image: e.target.value })}
              placeholder="e.g. /brand/promo_coffee_offer.jpg or https://..."
              className={inputCx}
            />
          </div>
        </div>

        {/* Save CTA Row */}
        <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
          <Button
            variant="outline"
            onClick={() => setDraft(currentOffer)}
          >
            Reset
          </Button>

          <Button
            variant="primary"
            onClick={handleSave}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-6 py-2.5"
          >
            {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saved ? 'Saved!' : 'Save & Publish Offer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
