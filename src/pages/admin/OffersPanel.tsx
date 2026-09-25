import { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Megaphone,
  Save,
  Sparkles,
} from 'lucide-react';
import { actions, useCategories, useSettings } from '../../lib/store';
import type { PromoOffer } from '../../lib/types';
import { defaultPromoOffer } from '../../lib/seed';
import { useToast } from '../../components/ui';

const QUICK_OFFERS: { name: string; badge: string; emoji: string; data: PromoOffer }[] = [
  {
    name: 'Coffee 20% Off',
    badge: '20% OFF',
    emoji: '☕',
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
    name: 'Malai Cha Special',
    badge: '10% OFF',
    emoji: '🍵',
    data: {
      enabled: true,
      tag: 'Evening Special',
      title: 'Special Malai Cha Offer',
      subtitle: 'Rich creamy Malai Cha brewed fresh for you!',
      buttonText: 'Order Tea →',
      image: '/menu/malai_cha_hd.jpg',
      targetCategory: 'c-tea',
      discountPercent: 10,
    },
  },
  {
    name: 'Chicken Snacks Deal',
    badge: '15% OFF',
    emoji: '🍗',
    data: {
      enabled: true,
      tag: "Chef's Choice",
      title: '15% Off on Chicken Snacks',
      subtitle: 'Hot & crispy chicken snacks freshly fried!',
      buttonText: 'View Snacks →',
      image: '/brand/chicken_snacks_hero.jpg',
      targetCategory: 'c-chicken-snacks',
      discountPercent: 15,
    },
  },
  {
    name: 'Shawarma Combo',
    badge: '25% OFF',
    emoji: '🌯',
    data: {
      enabled: true,
      tag: 'Bestseller Deal',
      title: '25% Off on Chicken Shawarma',
      subtitle: 'Juicy roasted chicken shawarma roll with extra mayo!',
      buttonText: 'Order Now →',
      image: '/menu/shawarma_roll_hd.jpg',
      targetCategory: 'c-shawarma',
      discountPercent: 25,
    },
  },
];

const PHOTO_OPTIONS = [
  { label: 'Coffee', url: '/brand/promo_coffee_offer.jpg' },
  { label: 'Malai Cha', url: '/menu/malai_cha_hd.jpg' },
  { label: 'Chicken Snacks', url: '/brand/chicken_snacks_hero.jpg' },
  { label: 'Shawarma', url: '/menu/shawarma_roll_hd.jpg' },
  { label: 'Chinese Rice', url: '/menu/chinese_sizzler_hd.jpg' },
  { label: 'Cold Coffee', url: '/menu/cold_coffee_special.jpg' },
];

const DISCOUNT_CHIPS = [0, 10, 15, 20, 25, 30, 50];

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

  const saveOffer = (nextOffer: PromoOffer, message = 'Offer saved & updated on live menu!') => {
    setDraft(nextOffer);
    actions.saveSettings({ offer: nextOffer });
    setSaved(true);
    toast(message, 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleToggleEnabled = () => {
    const next = { ...draft, enabled: !draft.enabled };
    saveOffer(
      next,
      next.enabled
        ? 'Offer is now LIVE on the customer menu!'
        : 'Offer hidden from the customer menu.',
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* ---------------- Top Simple Status & ON/OFF Card ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[26px] border border-[#DCE5DC] bg-gradient-to-r from-[#F1F5F0] to-[#E8EFE8] p-5 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-sm ${
              draft.enabled ? 'bg-[#113626]' : 'bg-[#7A756C]'
            }`}
          >
            <Megaphone size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-editorial text-[20px] font-bold text-[#18221D]">
                Customer Menu Offer Banner
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-bold ${
                  draft.enabled
                    ? 'bg-[#1D7E48]/15 text-[#1B5E37]'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    draft.enabled ? 'bg-[#1D7E48]' : 'bg-stone-500'
                  }`}
                />
                {draft.enabled ? 'Active (চলেছে)' : 'Off (বন্ধ আছে)'}
              </span>
            </div>
            <p className="mt-0.5 text-[13px] text-[#5C6660]">
              কাস্টমার যখন QR স্ক্যান করে মেনু খুলবে, তখন উপরে এই স্পেশাল অফারটি দেখতে পাবে।
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleEnabled}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold transition shadow-xs cursor-pointer ${
            draft.enabled
              ? 'border border-rose-200 bg-white text-rose-700 hover:bg-rose-50'
              : 'bg-[#113626] text-white hover:bg-[#194B35]'
          }`}
        >
          {draft.enabled ? (
            <>
              <EyeOff size={15} /> Turn Off Offer (বন্ধ করুন)
            </>
          ) : (
            <>
              <Eye size={15} /> Turn On Offer (চালু করুন)
            </>
          )}
        </button>
      </div>

      {/* ---------------- Step 1: 1-Click Ready Templates ---------------- */}
      <div className="rounded-[26px] border border-[#E4DEC9] bg-[#FAF8F4] p-5 shadow-2xs">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#113626] text-[12px] font-bold text-white">
              1
            </span>
            <h3 className="font-editorial text-[17px] font-bold text-[#1D2420]">
              Ready Offers (১-ক্লিকে যেকোনো একটি বেছে নিন)
            </h3>
          </div>
          <span className="text-[12px] font-medium text-[#7A756C]">Click to apply instantly</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_OFFERS.map((item, idx) => {
            const isSelected = draft.title === item.data.title;
            return (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  saveOffer(
                    { ...item.data, enabled: true },
                    `"${item.name}" অফারটি চালু করা হয়েছে!`,
                  )
                }
                className={`group flex flex-col justify-between rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                  isSelected
                    ? 'border-[#113626] bg-[#EFF4EF] ring-2 ring-[#113626]/15'
                    : 'border-[#E5DFD2] bg-white hover:border-[#113626]/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="rounded-full bg-[#FBF2EB] px-2.5 py-0.5 text-[11px] font-extrabold text-[#C8562E]">
                      {item.badge}
                    </span>
                  </div>
                  <p className="mt-2 font-editorial text-[15px] font-bold text-[#1D2420]">
                    {item.name}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[11.5px] text-[#6E6A61]">
                    {item.data.title}
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-1 text-[11.5px] font-bold text-[#113626]">
                  {isSelected ? (
                    <>
                      <CheckCircle2 size={13} className="text-[#1D7E48]" /> Currently Selected
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} /> Use this offer →
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- Step 2: Simple Customizer + Live Preview ---------------- */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: 3 Easy Fields */}
        <div className="space-y-4 rounded-[26px] border border-[#E4DEC9] bg-[#FAF8F4] p-5 shadow-2xs lg:col-span-7">
          <div className="flex items-center gap-2 border-b border-[#EAE4D7] pb-3">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#113626] text-[12px] font-bold text-white">
              2
            </span>
            <h3 className="font-editorial text-[17px] font-bold text-[#1D2420]">
              Customize Offer (নিজের মতো পরিবর্তন করুন)
            </h3>
          </div>

          {/* Field 1: Which Category + Discount % */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[#2B342E]">
                ১. কোন ক্যাটাগরির ওপর অফার?
              </label>
              <select
                value={draft.targetCategory || 'c-coffee'}
                onChange={(e) => setDraft({ ...draft, targetCategory: e.target.value })}
                className="w-full rounded-xl border border-[#DFD8C8] bg-white px-3.5 py-2.5 text-[14px] font-medium text-[#1D2420] outline-none focus:border-[#113626]"
              >
                <option value="all">🍽️ All Items (সব খাবার)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[#2B342E]">
                ২. কত শতাংশ ছাড় (Discount %)?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DISCOUNT_CHIPS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      const nextTitle =
                        pct > 0
                          ? `Enjoy ${pct}% Off on ${
                              categories.find((c) => c.id === draft.targetCategory)?.name || 'Menu'
                            }`
                          : draft.title;
                      setDraft({
                        ...draft,
                        discountPercent: pct,
                        title: nextTitle,
                      });
                    }}
                    className={`rounded-xl border px-3 py-2 text-[12.5px] font-bold transition cursor-pointer ${
                      (draft.discountPercent || 0) === pct
                        ? 'border-[#113626] bg-[#113626] text-white'
                        : 'border-[#DFD8C8] bg-white text-[#2B342E] hover:border-[#113626]'
                    }`}
                  >
                    {pct === 0 ? 'No %' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Field 2: Main Offer Title */}
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-[#2B342E]">
              ৩. অফারের মূল লেখা (Headline)
            </label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="যেমন: Enjoy 20% Off on Coffee"
              className="w-full rounded-xl border border-[#DFD8C8] bg-white px-3.5 py-2.5 text-[14px] font-medium text-[#1D2420] outline-none focus:border-[#113626]"
            />
          </div>

          {/* Field 3: Small Subtitle */}
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-[#2B342E]">
              ৪. ছোট বিবরণ (Subtitle)
            </label>
            <input
              type="text"
              value={draft.subtitle}
              onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
              placeholder="যেমন: Because good vibes taste better with coffee!"
              className="w-full rounded-xl border border-[#DFD8C8] bg-white px-3.5 py-2.5 text-[14px] text-[#1D2420] outline-none focus:border-[#113626]"
            />
          </div>

          {/* Field 4: Simple Photo Picker */}
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-[#2B342E]">
              ৫. অফারের ছবি বেছে নিন (Choose Photo)
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {PHOTO_OPTIONS.map((img, i) => {
                const active = draft.image === img.url;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDraft({ ...draft, image: img.url })}
                    className={`group relative overflow-hidden rounded-xl border p-1 text-center transition cursor-pointer ${
                      active
                        ? 'border-[#113626] bg-[#EFF4EF] ring-2 ring-[#113626]/20'
                        : 'border-[#DFD8C8] bg-white hover:border-[#113626]/40'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.label}
                      className="h-12 w-full rounded-lg object-cover"
                    />
                    <span className="mt-1 block truncate text-[10px] font-bold text-[#2B342E]">
                      {img.label}
                    </span>
                    {active && (
                      <span className="absolute top-1.5 right-1.5 grid h-4 w-4 place-items-center rounded-full bg-[#113626] text-white">
                        <Check size={10} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => saveOffer(draft)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#113626] px-6 py-3.5 text-[14px] font-bold text-white shadow-sm transition hover:bg-[#194B35] active:scale-[0.99] cursor-pointer"
            >
              {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
              {saved ? 'Saved Successfully!' : 'Save Offer (অফার সেভ করুন)'}
            </button>
          </div>
        </div>

        {/* Right: Live Mobile Card Preview */}
        <div className="flex flex-col justify-between rounded-[26px] border border-[#E4DEC9] bg-[#FAF8F4] p-5 shadow-2xs lg:col-span-5">
          <div>
            <div className="mb-3 flex items-center justify-between border-b border-[#EAE4D7] pb-3">
              <h3 className="font-editorial text-[17px] font-bold text-[#1D2420]">
                Live Menu Preview
              </h3>
              <span className="rounded-full bg-[#E5F2E9] px-2.5 py-0.5 text-[11px] font-bold text-[#1B5E37]">
                কাস্টমার যেভাবে দেখবে
              </span>
            </div>

            <p className="mb-4 text-[12.5px] text-[#6E6A61]">
              কাস্টমারের ফোনের মেনুতে অফার কার্ডটি ঠিক নিচের মতো দেখাবে:
            </p>

            {/* Preview Mockup Box */}
            <div
              className={`rounded-3xl border p-4 transition ${
                draft.enabled
                  ? 'border-[#E5DEC9] bg-[#F5F2EB]'
                  : 'border-dashed border-stone-300 bg-stone-100 opacity-60'
              }`}
            >
              <div className="relative overflow-hidden rounded-[22px] border border-[#E8DEC8] bg-gradient-to-r from-[#F6F0E4] via-[#FDFBF7] to-[#F1E9D7] p-3.5 shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#DEBE92] bg-[#ECD7B5]/60 text-[#8C5E28]">
                      <Megaphone size={18} className="-rotate-12" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A06C30]">
                          {draft.tag || "Today's Special"}
                        </span>
                        {draft.discountPercent ? (
                          <span className="rounded-full bg-[#D95B2B] px-2 py-0.5 text-[9px] font-black text-white">
                            {draft.discountPercent}% OFF
                          </span>
                        ) : null}
                      </div>

                      <h4 className="mt-0.5 truncate font-editorial text-[15px] font-bold text-[#1D2420]">
                        {draft.title || 'Enjoy 20% Off on Coffee'}
                      </h4>

                      <p className="mt-0.5 line-clamp-2 text-[11px] text-[#5C635E]">
                        {draft.subtitle || 'Because good vibes taste better with coffee!'}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <img
                      src={draft.image || '/brand/promo_coffee_offer.jpg'}
                      alt="Offer"
                      className="h-14 w-14 rounded-2xl border border-[#DEBE92]/50 object-cover"
                    />
                    <span className="rounded-full bg-[#113626] px-3 py-1 text-[10px] font-bold text-white">
                      {draft.buttonText || 'View Menu →'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#DCE5DC] bg-[#EFF4EF] p-3.5 text-[12px] text-[#26302A]">
            <p className="font-bold text-[#113626]">💡 কীভাবে কাজ করে?</p>
            <ul className="mt-1.5 space-y-1 text-[#4A554E]">
              <li>• উপরের যেকোনো <b>Ready Offer</b>-এ ক্লিক করলেই অফার সাথে সাথে চালু হয়ে যাবে।</li>
              <li>• অথবা ডিসকাউন্ট `%` এবং নাম পাল্টে <b>Save Offer</b> বাটনে চাপুন।</li>
              <li>• অফার বন্ধ রাখতে চাইলে উপরের <b>Turn Off Offer</b> বাটনে ক্লিক করুন।</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

