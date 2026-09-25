import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Megaphone,
  Save,
  Sparkles,
  Upload,
} from 'lucide-react';
import { actions, useCategories, useItems, useSettings } from '../../lib/store';
import type { PromoOffer } from '../../lib/types';
import { defaultPromoOffer } from '../../lib/seed';
import { useToast } from '../../components/ui';

interface CategoryPresetConfig {
  id: string;
  name: string;
  emoji: string;
  tag: string;
  defaultDiscount: number;
  buttonText: string;
  titleTemplate: (pct: number) => string;
  subtitles: string[];
  photos: { label: string; url: string }[];
}

const CATEGORY_PRESETS: Record<string, CategoryPresetConfig> = {
  'c-coffee': {
    id: 'c-coffee',
    name: 'Coffee',
    emoji: '☕',
    tag: "Today's Special",
    defaultDiscount: 20,
    buttonText: 'Order Coffee →',
    titleTemplate: (pct) =>
      pct > 0 ? `Enjoy ${pct}% Off on Coffee` : 'Special Hot & Cold Coffee Deal',
    subtitles: [
      'Because good vibes taste better with freshly brewed coffee!',
      'Chilled thick Cold Coffee & rich Cappuccino at a special price today!',
      'Take a coffee break and enjoy creamy perfection in every sip!',
    ],
    photos: [
      { label: 'Cold Coffee Promo', url: '/brand/promo_coffee_offer.jpg' },
      { label: 'Special Cold Coffee', url: '/menu/cold_coffee_special.jpg' },
      { label: 'Hot Whipped Coffee', url: '/menu/hot_coffee.jpg' },
      { label: 'Cappuccino', url: '/menu/cappuccino.jpg' },
      { label: 'Iced Frappe', url: '/menu/frappe.jpg' },
      { label: 'Black Espresso', url: '/menu/espresso.jpg' },
    ],
  },
  'c-tea': {
    id: 'c-tea',
    name: 'Tea & Malai Cha',
    emoji: '🍵',
    tag: "Chai Lover's Special",
    defaultDiscount: 15,
    buttonText: 'Order Tea →',
    titleTemplate: (pct) =>
      pct > 0 ? `Enjoy ${pct}% Off on Special Malai Cha & Tea` : 'Special Malai Cha & Assam Tea',
    subtitles: [
      'Freshly brewed rich Malai Cha topped with luscious clotted cream!',
      'Warm up your mood with a steaming cup of authentic Kolkata style chai!',
      'Good conversations start over a hot cup of Dudh & Masala Cha!',
    ],
    photos: [
      { label: 'Special Malai Cha', url: '/menu/malai_cha_hd.jpg' },
      { label: 'Traditional Chai', url: '/menu/chai.jpg' },
      { label: 'Refreshing Lemon Tea', url: '/menu/peachtea.jpg' },
    ],
  },
  'c-chicken-snacks': {
    id: 'c-chicken-snacks',
    name: 'Chicken Snacks',
    emoji: '🍗',
    tag: "Chef's Choice",
    defaultDiscount: 15,
    buttonText: 'Explore Snacks →',
    titleTemplate: (pct) =>
      pct > 0 ? `Enjoy ${pct}% Off on Crispy Chicken Snacks` : 'Hot & Crispy Chicken Snacks Combo',
    subtitles: [
      'Golden fried Chicken Popcorn, Butter Fry & juicy wings made fresh!',
      'Crunchy outside, tender & juicy inside — the ultimate chicken treat!',
      'Craving something crispy? Grab our hot chicken snacks platter now!',
    ],
    photos: [
      { label: 'Chicken Snacks Platter', url: '/brand/chicken_snacks_hero.jpg' },
      { label: 'Chicken Popcorn', url: '/menu/chicken_popcorn_hd.jpg' },
      { label: 'Chicken Butter Fry', url: '/menu/chicken_butter_fry_hd.jpg' },
      { label: 'Chicken Snack Balls', url: '/menu/chicken_snacki_ball.jpg' },
      { label: 'Crispy French Fries', url: '/menu/fries.jpg' },
    ],
  },
  'c-shawarma': {
    id: 'c-shawarma',
    name: 'Shawarma',
    emoji: '🌯',
    tag: 'Bestseller Deal',
    defaultDiscount: 20,
    buttonText: 'Order Shawarma →',
    titleTemplate: (pct) =>
      pct > 0 ? `Enjoy ${pct}% Off on Chicken Shawarma Rolls` : 'Special Loaded Chicken Shawarma',
    subtitles: [
      'Slow-roasted spiced chicken wrapped with creamy garlic mayo & extra cheese!',
      'Our #1 bestselling juicy Chicken Shawarma Roll freshly grilled for you!',
      'Loaded with tender roasted chicken, pickles & signature tahini garlic sauce!',
    ],
    photos: [
      { label: 'Chicken Shawarma HD', url: '/menu/shawarma_roll_hd.jpg' },
      { label: 'Classic Shawarma Wrap', url: '/menu/wrap.jpg' },
    ],
  },
  'c-starters': {
    id: 'c-starters',
    name: 'Starters',
    emoji: '🌶️',
    tag: 'Crispy Starters Deal',
    defaultDiscount: 15,
    buttonText: 'View Starters →',
    titleTemplate: (pct) =>
      pct > 0 ? `Enjoy ${pct}% Off on Hot Crispy Starters` : 'Hot & Spicy Chinese Starters',
    subtitles: [
      'Hot, spicy & crispy starters freshly tossed from our wok to your table!',
      'Kickstart your meal with juicy Chilli Chicken, Spring Rolls & Manchurian!',
      'Perfect crunchy starters to share with your friends & family today!',
    ],
    photos: [
      { label: 'Chilli Chicken Dry', url: '/menu/chilli_chicken_hd.jpg' },
      { label: 'Crispy Spring Rolls', url: '/menu/spring_roll.jpg' },
      { label: 'Veg Manchurian', url: '/menu/veg_manchurian_hd.jpg' },
      { label: 'Chicken Pepper Dry', url: '/menu/chicken_pepper_dry.jpg' },
    ],
  },
  'c-rice': {
    id: 'c-rice',
    name: 'Rice & Sizzlers',
    emoji: '🍚',
    tag: 'Meal Combo Offer',
    defaultDiscount: 20,
    buttonText: 'Order Rice →',
    titleTemplate: (pct) =>
      pct > 0 ? `Enjoy ${pct}% Off on Fried Rice & Sizzlers` : 'Hot Chinese Fried Rice & Sizzler Bowls',
    subtitles: [
      'Wok-tossed aromatic Fried Rice, Burnt Garlic Rice & sizzling platters!',
      'Hearty, flavorful Chinese rice bowls cooked fresh to perfection!',
      'Hungry? Treat yourself to a hot & filling rice meal at Ivan Food Court!',
    ],
    photos: [
      { label: 'Chinese Sizzler Bowl', url: '/menu/chinese_sizzler_hd.jpg' },
      { label: 'Burnt Garlic Rice', url: '/menu/burnt_garlic_rice_hd.jpg' },
      { label: 'Schezwan Fried Rice', url: '/menu/schezwan_rice.jpg' },
      { label: 'Veg Fried Rice', url: '/menu/veg_fried_rice.jpg' },
    ],
  },
  'c-noodles': {
    id: 'c-noodles',
    name: 'Noodles',
    emoji: '🍜',
    tag: 'Wok Special',
    defaultDiscount: 15,
    buttonText: 'Order Noodles →',
    titleTemplate: (pct) =>
      pct > 0 ? `Enjoy ${pct}% Off on Hakka & Schezwan Noodles` : 'Hot Wok-Tossed Chinese Noodles',
    subtitles: [
      'Smoky wok-tossed Hakka & fiery Schezwan noodles loaded with veggies & chicken!',
      'Slurp up the goodness of authentic street-style Chinese noodles!',
      'Hot, saucy & delicious noodles freshly tossed just the way you love!',
    ],
    photos: [
      { label: 'Hakka Noodles HD', url: '/menu/hakka_noodles_hd.jpg' },
      { label: 'Schezwan Noodles', url: '/menu/schezwan_noodles_hd.jpg' },
      { label: 'Malaysia Noodles', url: '/menu/malaysia_noodles.jpg' },
    ],
  },
  'c-soups': {
    id: 'c-soups',
    name: 'Soups',
    emoji: '🍲',
    tag: 'Warm & Comforting',
    defaultDiscount: 10,
    buttonText: 'Order Soup →',
    titleTemplate: (pct) =>
      pct > 0 ? `Enjoy ${pct}% Off on Steaming Hot Soups` : 'Hot & Spicy Manchow & Corn Soups',
    subtitles: [
      'Steaming hot Manchow & Sweet Corn soups topped with crispy fried noodles!',
      'Rich, flavorful & comforting bowls of soup made fresh on order!',
      'Nothing beats a warm, aromatic bowl of soup to start your meal!',
    ],
    photos: [
      { label: 'Manchow Soup HD', url: '/menu/manchow_soup_hd.jpg' },
      { label: 'Hot Tom Yum Soup', url: '/menu/tom_yum_soup.jpg' },
    ],
  },
  'c-lassi': {
    id: 'c-lassi',
    name: 'Lassi',
    emoji: '🥤',
    tag: 'Cool & Creamy',
    defaultDiscount: 15,
    buttonText: 'Order Lassi →',
    titleTemplate: (pct) =>
      pct > 0 ? `Enjoy ${pct}% Off on Rich Dry Fruit Lassi` : 'Chilled Creamy Malai & Dry Fruit Lassi',
    subtitles: [
      'Thick, chilled traditional Lassi loaded with malai, cashews & pistachios!',
      'Beat the heat with a tall glass of velvety Mango & Dry Fruit Lassi!',
      'Pure, creamy indulgence blended fresh with rich curd & dry fruits!',
    ],
    photos: [
      { label: 'Dry Fruit Lassi HD', url: '/menu/dry_fruit_lassi_hd.jpg' },
      { label: 'Blue Curacao Lassi', url: '/menu/blue_curacao_lassi_hd.jpg' },
      { label: 'Mango Lassi', url: '/menu/mango.jpg' },
    ],
  },
  'c-mocktails': {
    id: 'c-mocktails',
    name: 'Mocktails',
    emoji: '🍹',
    tag: 'Chilled Refreshers',
    defaultDiscount: 20,
    buttonText: 'Order Mocktails →',
    titleTemplate: (pct) =>
      pct > 0 ? `Enjoy ${pct}% Off on Refreshing Mocktails` : 'Icy Handcrafted Mocktails & Mojitos',
    subtitles: [
      'Sparkling Virgin Mojito, Blue Lagoon & fruity coolers to refresh your mood!',
      'Sip into paradise with our icy, zesty handcrafted mocktails!',
      'Cool, fizzy & bursting with fresh mint and citrus flavors in every glass!',
    ],
    photos: [
      { label: 'Tropical Mocktails HD', url: '/menu/tropical_mocktail_hd.jpg' },
      { label: 'Fresh Lime Soda', url: '/menu/limesoda.jpg' },
    ],
  },
  'c-egg-lolly': {
    id: 'c-egg-lolly',
    name: 'Egg Lolly Pop',
    emoji: '🍳',
    tag: 'Evening Bite Special',
    defaultDiscount: 15,
    buttonText: 'Order Egg Lolly →',
    titleTemplate: (pct) =>
      pct > 0 ? `Enjoy ${pct}% Off on Crispy Egg Lolly Pop` : 'Hot & Crispy Chicken Egg Lolly Pops',
    subtitles: [
      'Golden deep-fried spiced egg & chicken lolly pops served hot on skewers!',
      'Crunchy, chatpata & irresistible — the perfect partner with evening chai!',
      'Try our signature Chicken & Bread Egg Lolly Pops with tangy dip!',
    ],
    photos: [
      { label: 'Egg Lolly Pop HD', url: '/menu/egg_lolly_hd.jpg' },
      { label: 'Egg Lolly Platter', url: '/menu/egg_lolly_plate.jpg' },
      { label: 'Egg Lolly Skewers', url: '/menu/egg_lolly_skewer.jpg' },
    ],
  },
  all: {
    id: 'all',
    name: 'All Menu Items',
    emoji: '🍽️',
    tag: 'Grand Feast Offer',
    defaultDiscount: 20,
    buttonText: 'View Full Menu →',
    titleTemplate: (pct) =>
      pct > 0 ? `Enjoy ${pct}% Off on Our Full Menu Today` : 'Special Feast Offer on All Dishes',
    subtitles: [
      'Order your favorite tea, coffee, snacks, noodles or shawarma at a special discount!',
      'Good Food, Good Mood — enjoy special savings across all dishes today!',
      'Celebrate great food with friends & family at Ivan Food Court!',
    ],
    photos: [
      { label: 'Cafe Hero Banner', url: '/brand/hero_coffee_banner.jpg' },
      { label: 'Coffee Promo', url: '/brand/promo_coffee_offer.jpg' },
      { label: 'Chicken Snacks', url: '/brand/chicken_snacks_hero.jpg' },
      { label: 'Chinese Sizzler', url: '/menu/chinese_sizzler_hd.jpg' },
    ],
  },
};

const DISCOUNT_CHIPS = [0, 10, 15, 20, 25, 30, 50];

export default function OffersPanel() {
  const settings = useSettings();
  const categories = useCategories();
  const menuItems = useItems();
  const toast = useToast();

  const currentOffer: PromoOffer = settings.offer || defaultPromoOffer;
  const [draft, setDraft] = useState<PromoOffer>(currentOffer);
  const [saved, setSaved] = useState(false);
  const [photoFilter, setPhotoFilter] = useState<'category' | 'all'>('category');

  useEffect(() => {
    if (settings.offer) {
      setDraft(settings.offer);
    }
  }, [settings.offer]);

  const activeCategoryConfig =
    CATEGORY_PRESETS[draft.targetCategory || 'c-coffee'] || CATEGORY_PRESETS['c-coffee'];

  // Build deduplicated full photo library from all category presets + all live menu items
  const allPhotos = useMemo(() => {
    const map = new Map<string, { label: string; url: string; categoryId: string }>();

    Object.values(CATEGORY_PRESETS).forEach((cfg) => {
      cfg.photos.forEach((p) => {
        if (!map.has(p.url)) {
          map.set(p.url, { label: p.label, url: p.url, categoryId: cfg.id });
        }
      });
    });

    menuItems.forEach((item) => {
      if (item.image && !map.has(item.image)) {
        map.set(item.image, {
          label: item.name,
          url: item.image,
          categoryId: item.categoryId,
        });
      }
    });

    return Array.from(map.values());
  }, [menuItems]);

  const displayedPhotos = useMemo(() => {
    if (photoFilter === 'all' || draft.targetCategory === 'all') {
      return allPhotos;
    }
    const catPhotos = allPhotos.filter((p) => p.categoryId === draft.targetCategory);
    return catPhotos.length > 0 ? catPhotos : allPhotos;
  }, [allPhotos, photoFilter, draft.targetCategory]);

  const saveOffer = (nextOffer: PromoOffer, message = 'Offer saved & updated on live menu!') => {
    setDraft(nextOffer);
    actions.saveSettings({ offer: nextOffer });
    setSaved(true);
    toast(message, 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  // When user selects a category, automatically set tailored Title, Subtitle, Tag, Button & Photo for that category!
  const handleSelectCategory = (categoryId: string, autoSave = false) => {
    const cfg = CATEGORY_PRESETS[categoryId] || CATEGORY_PRESETS['all'];
    const pct = draft.discountPercent ?? cfg.defaultDiscount;
    const nextOffer: PromoOffer = {
      ...draft,
      enabled: true,
      targetCategory: categoryId,
      discountPercent: pct,
      tag: cfg.tag,
      title: cfg.titleTemplate(pct),
      subtitle: cfg.subtitles[0],
      buttonText: cfg.buttonText,
      image: cfg.photos[0]?.url || '/brand/promo_coffee_offer.jpg',
    };
    if (autoSave) {
      saveOffer(nextOffer, `${cfg.emoji} ${cfg.name} অফারটি চালু করা হয়েছে!`);
    } else {
      setDraft(nextOffer);
    }
  };

  const handleSelectDiscount = (pct: number) => {
    const cfg = CATEGORY_PRESETS[draft.targetCategory || 'c-coffee'] || CATEGORY_PRESETS['all'];
    setDraft({
      ...draft,
      discountPercent: pct,
      title: cfg.titleTemplate(pct),
    });
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraft((prev) => ({ ...prev, image: reader.result as string }));
        toast('Custom photo selected! Click Save Offer to publish.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
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
              যেকোনো ক্যাটাগরি সিলেক্ট করলেই সেই ক্যাটাগরির নিজস্ব Title, Subtitle এবং ছবি অটোমেটিক সেট হয়ে যাবে।
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleEnabled}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold shadow-xs transition cursor-pointer ${
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

      {/* ---------------- Step 1: 1-Click Category Offers (All Categories) ---------------- */}
      <div className="rounded-[26px] border border-[#E4DEC9] bg-[#FAF8F4] p-5 shadow-2xs">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#113626] text-[12px] font-bold text-white">
              1
            </span>
            <h3 className="font-editorial text-[17px] font-bold text-[#1D2420]">
              ১-ক্লিকে ক্যাটাগরি অফার বেছে নিন (সকল ক্যাটাগরি)
            </h3>
          </div>
          <span className="text-[12px] font-medium text-[#7A756C]">
            যেকোনো কার্ডে ক্লিক করলেই তার নিজস্ব ছবি ও সাবটাইটেলসহ অফার চালু হবে
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Object.values(CATEGORY_PRESETS).map((cfg) => {
            const isSelected = draft.targetCategory === cfg.id;
            return (
              <button
                key={cfg.id}
                type="button"
                onClick={() => handleSelectCategory(cfg.id, true)}
                className={`group flex flex-col justify-between overflow-hidden rounded-2xl border p-2.5 text-left transition cursor-pointer ${
                  isSelected
                    ? 'border-[#113626] bg-[#EFF4EF] ring-2 ring-[#113626]/20'
                    : 'border-[#E5DFD2] bg-white hover:border-[#113626]/50'
                }`}
              >
                <div>
                  <div className="relative h-16 w-full overflow-hidden rounded-xl bg-stone-100">
                    <img
                      src={cfg.photos[0]?.url}
                      alt={cfg.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/brand/promo_coffee_offer.jpg';
                      }}
                    />
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                      {cfg.emoji} {cfg.defaultDiscount}% OFF
                    </span>
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#113626] text-white shadow-xs">
                        <Check size={11} />
                      </span>
                    )}
                  </div>
                  <p className="mt-2 truncate font-editorial text-[13.5px] font-bold text-[#1D2420]">
                    {cfg.name}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[10.5px] text-[#6E6A61]">
                    {cfg.subtitles[0]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- Step 2: Customizer + Live Preview ---------------- */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Column: Easy Customizer */}
        <div className="space-y-4 rounded-[26px] border border-[#E4DEC9] bg-[#FAF8F4] p-5 shadow-2xs lg:col-span-7">
          <div className="flex items-center gap-2 border-b border-[#EAE4D7] pb-3">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#113626] text-[12px] font-bold text-white">
              2
            </span>
            <h3 className="font-editorial text-[17px] font-bold text-[#1D2420]">
              অফার কাস্টমাইজ করুন ({activeCategoryConfig.emoji} {activeCategoryConfig.name})
            </h3>
          </div>

          {/* 1. Category & Discount % */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[#2B342E]">
                ১. কোন ক্যাটাগরির ওপর অফার?
              </label>
              <select
                value={draft.targetCategory || 'c-coffee'}
                onChange={(e) => handleSelectCategory(e.target.value, false)}
                className="w-full rounded-xl border border-[#DFD8C8] bg-white px-3.5 py-2.5 text-[13.5px] font-semibold text-[#1D2420] outline-none focus:border-[#113626]"
              >
                <option value="all">🍽️ All Menu Items (সব খাবার)</option>
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
                    onClick={() => handleSelectDiscount(pct)}
                    className={`rounded-xl border px-2.5 py-2 text-[12px] font-bold transition cursor-pointer ${
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

          {/* 2. Main Headline */}
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-[#2B342E]">
              ৩. অফারের মূল লেখা (Headline Title)
            </label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Enjoy 20% Off on Coffee"
              className="w-full rounded-xl border border-[#DFD8C8] bg-white px-3.5 py-2.5 text-[14px] font-semibold text-[#1D2420] outline-none focus:border-[#113626]"
            />
          </div>

          {/* 3. Subtitle with Category-Specific Ready Suggestions! */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[12px] font-bold text-[#2B342E]">
                ৪. ছোট বিবরণ (Subtitle — {activeCategoryConfig.name}-এর জন্য আলাদা সাবটাইটেল)
              </label>
            </div>
            <input
              type="text"
              value={draft.subtitle}
              onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
              placeholder="ছোট বিবরণ লিখুন বা নিচের রেডি সাবটাইটেলে ক্লিক করুন..."
              className="w-full rounded-xl border border-[#DFD8C8] bg-white px-3.5 py-2.5 text-[13.5px] text-[#1D2420] outline-none focus:border-[#113626]"
            />

            {/* Clickable Subtitle Suggestions for the current category */}
            <div className="mt-2 space-y-1.5">
              <p className="text-[11px] font-bold text-[#6E6A61]">
                ✨ {activeCategoryConfig.name}-এর জন্য রেডি সাবটাইটেল (ক্লিক করে বেছে নিন):
              </p>
              <div className="flex flex-col gap-1.5">
                {activeCategoryConfig.subtitles.map((sub, i) => {
                  const activeSub = draft.subtitle === sub;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDraft({ ...draft, subtitle: sub })}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-[12px] transition cursor-pointer ${
                        activeSub
                          ? 'border-[#113626] bg-[#EFF4EF] font-semibold text-[#113626]'
                          : 'border-[#E5DFD2] bg-white text-[#4A554E] hover:border-[#113626]/40'
                      }`}
                    >
                      <span className="line-clamp-1">“{sub}”</span>
                      {activeSub ? (
                        <Check size={13} className="shrink-0 text-[#1D7E48]" />
                      ) : (
                        <span className="shrink-0 text-[10px] font-bold text-[#113626]">
                          Use →
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Complete Photo Picker (Category Photos + All Menu Photos + Upload) */}
          <div className="border-t border-[#EAE4D7] pt-3">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-[12px] font-bold text-[#2B342E]">
                <ImageIcon size={14} className="text-[#113626]" />
                ৫. অফারের ছবি বেছে নিন ({displayedPhotos.length}টি ছবি)
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPhotoFilter('category')}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold transition cursor-pointer ${
                    photoFilter === 'category'
                      ? 'bg-[#113626] text-white'
                      : 'bg-white border border-[#DFD8C8] text-[#4A554E]'
                  }`}
                >
                  {activeCategoryConfig.emoji} {activeCategoryConfig.name} Photos
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoFilter('all')}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold transition cursor-pointer ${
                    photoFilter === 'all'
                      ? 'bg-[#113626] text-white'
                      : 'bg-white border border-[#DFD8C8] text-[#4A554E]'
                  }`}
                >
                  🖼️ All Menu Photos ({allPhotos.length})
                </button>
                <label className="inline-flex items-center gap-1 rounded-full border border-[#DFD8C8] bg-white px-3 py-1 text-[11px] font-bold text-[#113626] hover:bg-[#EFF4EF] cursor-pointer">
                  <Upload size={11} /> Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid max-h-[230px] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-5">
              {displayedPhotos.map((img, i) => {
                const active = draft.image === img.url;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDraft({ ...draft, image: img.url })}
                    className={`group relative overflow-hidden rounded-xl border p-1 text-center transition cursor-pointer ${
                      active
                        ? 'border-[#113626] bg-[#EFF4EF] ring-2 ring-[#113626]/20'
                        : 'border-[#DFD8C8] bg-white hover:border-[#113626]/50'
                    }`}
                  >
                    <div className="h-14 w-full overflow-hidden rounded-lg bg-stone-100">
                      <img
                        src={img.url}
                        alt={img.label}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/brand/promo_coffee_offer.jpg';
                        }}
                      />
                    </div>
                    <span className="mt-1 block truncate px-0.5 text-[10px] font-bold text-[#2B342E]">
                      {img.label}
                    </span>
                    {active && (
                      <span className="absolute top-1.5 right-1.5 grid h-4.5 w-4.5 place-items-center rounded-full bg-[#113626] text-white shadow-xs">
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

        {/* Right Column: Live Mobile Card Preview */}
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
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/brand/promo_coffee_offer.jpg';
                      }}
                    />
                    <span className="rounded-full bg-[#113626] px-3 py-1 text-[10px] font-bold text-white">
                      {draft.buttonText || 'View Menu →'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Extra Tag & Button Text quick editors */}
            <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-[#EAE4D7] bg-white p-3.5">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#5C6660]">
                  উপরের ছোট ট্যাগ (Tag)
                </label>
                <input
                  type="text"
                  value={draft.tag}
                  onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
                  className="w-full rounded-lg border border-[#DFD8C8] bg-[#FAF8F4] px-2.5 py-1.5 text-[12px] font-semibold text-[#1D2420] outline-none focus:border-[#113626]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#5C6660]">
                  বাটনের লেখা (Button)
                </label>
                <input
                  type="text"
                  value={draft.buttonText}
                  onChange={(e) => setDraft({ ...draft, buttonText: e.target.value })}
                  className="w-full rounded-lg border border-[#DFD8C8] bg-[#FAF8F4] px-2.5 py-1.5 text-[12px] font-semibold text-[#1D2420] outline-none focus:border-[#113626]"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[#DCE5DC] bg-[#EFF4EF] p-3.5 text-[12px] text-[#26302A]">
            <p className="flex items-center gap-1.5 font-bold text-[#113626]">
              <Sparkles size={14} /> এখন যা যা অটোমেটিক কাজ করবে:
            </p>
            <ul className="mt-1.5 space-y-1 text-[#4A554E]">
              <li>
                • <b>যেকোনো ক্যাটাগরি</b> (Tea, Coffee, Starters, Rice, Noodles, Soup, Lassi, Mocktail, Shawarma, Egg Lolly) বাছলেই সেই ক্যাটাগরির নিজস্ব <b>Title, Subtitle ও ছবি</b> চলে আসবে।
              </li>
              <li>
                • প্রতিটি ক্যাটাগরির জন্য <b>৩টি করে আলাদা রেডি সাবটাইটেল</b> দেওয়া আছে — ক্লিক করলেই সেট হবে।
              </li>
              <li>
                • ছবির সেকশনে ক্যাটাগরির ছবি ছাড়াও <b>All Menu Photos ({allPhotos.length}টি ছবি)</b> এবং নিজের ফোন/কম্পিউটার থেকে <b>Upload</b> করার অপশন যোগ করা হয়েছে।
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


