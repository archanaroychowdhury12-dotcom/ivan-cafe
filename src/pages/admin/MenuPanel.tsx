import { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  CircleSlash,
  ImagePlus,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Star,
  Tag,
  Trash2,
  Upload,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { actions, useCategories, useItems, useOrders } from '../../lib/store';
import { clockTime, dayLabel, money, uid } from '../../lib/format';
import type { AddonGroup, Category, MenuItem, ItemRatingStats } from '../../lib/types';
import { Button, Chip, EmptyState, Field, Sheet, Toggle, inputCx, useToast } from '../../components/ui';
import { getAllItemRatings } from '../../lib/reviews';

const IMAGE_PRESETS = [
  '/menu/latte.jpg',
  '/menu/burger.jpg',
  '/menu/pasta.jpg',
  '/menu/cheesecake.jpg',
  '/menu/friedrice.jpg',
  '/menu/avotoast.jpg',
  '/menu/chai.jpg',
  '/menu/fries.jpg',
];

const blank = (categoryId: string): MenuItem => ({
  id: uid('m_'),
  categoryId,
  name: '',
  description: '',
  price: 0,
  image: IMAGE_PRESETS[0],
  tags: [],
  veg: true,
  popular: false,
  soldOut: false,
  prepMins: 10,
  addonGroups: [],
  createdAt: Date.now(),
});

export default function MenuPanel() {
  const items = useItems();
  const categories = useCategories();
  const orders = useOrders();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [sortBy, setSortBy] = useState<'default' | 'rating' | 'reviews' | 'price-asc' | 'price-desc'>('default');
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState<MenuItem | null>(null);

  const ratingsMap = useMemo(() => getAllItemRatings(items, orders), [items, orders]);

  const list = useMemo(() => {
    const filtered = items.filter(
      (i) =>
        (cat === 'all' || i.categoryId === cat) &&
        (!q || (i.name + i.description).toLowerCase().includes(q.toLowerCase())),
    );

    if (sortBy === 'rating') {
      return [...filtered].sort((a, b) => {
        const rA = ratingsMap.get(a.id)?.averageRating || 0;
        const rB = ratingsMap.get(b.id)?.averageRating || 0;
        return rB - rA;
      });
    }
    if (sortBy === 'reviews') {
      return [...filtered].sort((a, b) => {
        const rA = ratingsMap.get(a.id)?.totalReviews || 0;
        const rB = ratingsMap.get(b.id)?.totalReviews || 0;
        return rB - rA;
      });
    }
    if (sortBy === 'price-asc') {
      return [...filtered].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price-desc') {
      return [...filtered].sort((a, b) => b.price - a.price);
    }
    return filtered;
  }, [items, cat, q, sortBy, ratingsMap]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mocha" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the menu"
            className="w-full rounded-2xl border border-line bg-paper py-3 pl-10 pr-3 text-[14px] outline-none focus:border-ember focus:ring-4 focus:ring-ember/10"
          />
        </div>
        <Button variant="outline" onClick={() => setCatOpen(true)}>
          <Tag size={15} /> Categories
        </Button>
        <Button onClick={() => setEditing(blank(categories[0]?.id ?? 'c-coffee'))}>
          <Plus size={16} /> New item
        </Button>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <Chip active={cat === 'all'} onClick={() => setCat('all')}>
          All ({items.length})
        </Chip>
        {categories.map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
            {c.emoji} {c.name} ({items.filter((i) => i.categoryId === c.id).length})
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-y border-line/60 py-2">
        <div className="flex flex-wrap items-center gap-1.5 text-mocha font-medium">
          <ArrowUpDown size={14} />
          <span>Sort by:</span>
          <button
            type="button"
            onClick={() => setSortBy('default')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${
              sortBy === 'default' ? 'bg-ink text-white shadow-xs' : 'bg-paper text-mocha hover:text-ink'
            }`}
          >
            Default
          </button>
          <button
            type="button"
            onClick={() => setSortBy('rating')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
              sortBy === 'rating'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Star size={11} className="fill-current" /> Highest Rated
          </button>
          <button
            type="button"
            onClick={() => setSortBy('reviews')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${
              sortBy === 'reviews' ? 'bg-ink text-white shadow-xs' : 'bg-paper text-mocha hover:text-ink'
            }`}
          >
            Most Reviewed
          </button>
          <button
            type="button"
            onClick={() => setSortBy('price-asc')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${
              sortBy === 'price-asc' ? 'bg-ink text-white shadow-xs' : 'bg-paper text-mocha hover:text-ink'
            }`}
          >
            Price ↑
          </button>
          <button
            type="button"
            onClick={() => setSortBy('price-desc')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${
              sortBy === 'price-desc' ? 'bg-ink text-white shadow-xs' : 'bg-paper text-mocha hover:text-ink'
            }`}
          >
            Price ↓
          </button>
        </div>

        <div className="text-[11.5px] font-bold text-amber-900 bg-amber-50/80 px-2.5 py-1 rounded-full border border-amber-200">
          ⭐ Verified Diner Ratings Active
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed size={22} />}
          title="No dishes here"
          sub="Create your first item for this category — it appears on every table menu instantly."
          action={
            <Button
              size="sm"
              onClick={() => setEditing(blank(cat === 'all' ? (categories[0]?.id ?? 'c-coffee') : cat))}
            >
              Add item
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((i) => {
            const rStats = ratingsMap.get(i.id);
            return (
              <article
                key={i.id}
                className="group overflow-hidden rounded-[24px] border border-line bg-paper shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={i.image}
                    alt={i.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    {i.popular && (
                      <span className="rounded-full bg-paper/90 px-2 py-0.5 text-[10px] font-bold uppercase text-ember-deep">
                        Popular
                      </span>
                    )}
                    {i.soldOut && (
                      <span className="rounded-full bg-berry px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        Sold out
                      </span>
                    )}
                  </div>

                  {/* Rating Badge on Image */}
                  {rStats && (
                    <button
                      type="button"
                      onClick={() => setReviewItem(i)}
                      className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-[11px] font-black text-amber-950 shadow-sm border border-amber-300 hover:scale-105 active:scale-95 transition"
                      title="View verified customer reviews"
                    >
                      <Star size={12} className="fill-amber-500 text-amber-500" />
                      <span>{rStats.averageRating}</span>
                      <span className="text-[9.5px] font-medium text-stone-500">({rStats.totalReviews})</span>
                    </button>
                  )}

                  <p className="absolute bottom-2.5 left-3 right-3 truncate font-display text-[16px] font-semibold text-cream">
                    {i.name}
                  </p>
                </div>
                <div className="p-3.5">
                  <p className="line-clamp-2 min-h-[34px] text-[12px] leading-relaxed text-mocha">
                    {i.description}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="font-display text-[17px] font-semibold">{money(i.price)}</span>
                    <button
                      type="button"
                      onClick={() => setReviewItem(i)}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200/70 hover:bg-amber-100 transition"
                    >
                      <Star size={11} className="fill-amber-500 text-amber-500" />
                      <span>{rStats?.averageRating || 4.5} ({rStats?.totalReviews || 0} reviews)</span>
                    </button>
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditing(i)}>
                      <Pencil size={13} /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReviewItem(i)}
                      title="View all customer reviews for this dish"
                      className="text-amber-900 border-amber-200 hover:bg-amber-50"
                    >
                      <Star size={13} className="fill-amber-500 text-amber-500" /> Reviews
                    </Button>
                    <Button
                      size="sm"
                      variant={i.soldOut ? 'soft' : 'ghost'}
                      onClick={() => {
                        actions.toggleSoldOut(i.id);
                        toast(i.soldOut ? `${i.name} is back on the menu` : `${i.name} marked sold out`, 'info');
                      }}
                      title="Toggle sold out"
                    >
                      <CircleSlash size={13} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete “${i.name}” from the menu?`)) {
                          actions.deleteItem(i.id);
                          toast('Item deleted', 'info');
                        }
                      }}
                      title="Delete"
                    >
                      <Trash2 size={13} className="text-berry" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ItemEditor item={editing} onClose={() => setEditing(null)} />
      <CategoryManager open={catOpen} onClose={() => setCatOpen(false)} />
      <DishReviewsSheet
        item={reviewItem}
        stats={reviewItem ? ratingsMap.get(reviewItem.id) : null}
        onClose={() => setReviewItem(null)}
      />
    </div>
  );
}

/* ------------------------------- dish reviews sheet ------------------------------ */

function DishReviewsSheet({
  item,
  stats,
  onClose,
}: {
  item: MenuItem | null;
  stats: ItemRatingStats | null | undefined;
  onClose: () => void;
}) {
  if (!item || !stats) return null;

  const total = stats.totalReviews;

  return (
    <Sheet open={!!item} onClose={onClose} title="Customer Ratings & Feedback">
      <div className="space-y-5 px-5 py-4">
        {/* Dish Summary Banner */}
        <div className="flex items-center gap-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3.5">
          <img
            src={item.image}
            alt={item.name}
            className="h-16 w-16 rounded-xl object-cover border border-amber-200 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-editorial text-lg font-bold text-stone-900 truncate">
              {item.name}
            </h3>
            <p className="text-xs text-stone-500 line-clamp-1">{item.description}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-display text-sm font-bold text-stone-900">
                {money(item.price)}
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                {stats.satisfactionPercent}% Loved
              </span>
            </div>
          </div>
        </div>

        {/* Big Rating Scorecard */}
        <div className="rounded-2xl border border-line bg-paper p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <Star size={30} className="fill-amber-500 text-amber-500" />
            <span className="font-display text-4xl font-extrabold text-stone-900">
              {stats.averageRating}
            </span>
            <span className="text-sm font-bold text-stone-400 self-end mb-1">/ 5.0</span>
          </div>
          <p className="mt-1 text-xs text-mocha">
            Based on <strong>{total}</strong> verified customer reviews from dining tables
          </p>

          {/* Star Distribution Progress Bars */}
          <div className="mt-4 space-y-1.5 text-xs text-stone-600 max-w-xs mx-auto">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = stats.starCounts[star] || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-6 text-right font-bold text-stone-700">{star}★</span>
                  <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-left text-[11px] text-stone-400 font-mono">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Reviews List */}
        <div>
          <h4 className="font-display text-sm font-bold text-stone-900 mb-3 flex items-center justify-between">
            <span>Verified Diner Reviews</span>
            <span className="text-xs text-mocha font-normal">{stats.recentReviews.length} entries</span>
          </h4>

          {stats.recentReviews.length === 0 ? (
            <div className="text-center py-6 text-xs text-mocha bg-stone-50 rounded-2xl border border-stone-200/60">
              No detailed comments left yet. Live customer reviews will appear here once served.
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {stats.recentReviews.map((rev, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-line bg-paper p-3.5 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
                        {rev.customerName.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-stone-900 leading-none">
                          {rev.customerName}
                        </p>
                        <p className="text-[10.5px] text-mocha mt-0.5">
                          Table {rev.tableCode} · {dayLabel(rev.createdAt)} at {clockTime(rev.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          className={
                            s <= rev.rating
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-stone-200'
                          }
                        />
                      ))}
                    </div>
                  </div>

                  {rev.tags && rev.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {rev.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900 border border-amber-200/60"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {rev.comment && (
                    <p className="text-[12px] text-stone-700 bg-[#FDFBF7] rounded-xl p-2.5 italic border border-stone-150">
                      "{rev.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Button full size="lg" variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Sheet>
  );
}

/* ------------------------------- item editor ------------------------------ */

/**
 * Resizes and compresses user-uploaded images from gallery/files
 * into a lightweight base64 data URL (< 60KB) for instant loading.
 */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 750;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ItemEditor({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  const categories = useCategories();
  const toast = useToast();
  const [draft, setDraft] = useState<MenuItem | null>(item);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prevId, setPrevId] = useState(item?.id);
  const [uploading, setUploading] = useState(false);

  if (item?.id !== prevId) {
    setPrevId(item?.id);
    setDraft(item);
    setErrors({});
  }
  if (!draft) return <Sheet open={false} onClose={onClose} children={null} />;

  const set = <K extends keyof MenuItem>(k: K, v: MenuItem[K]) => setDraft({ ...draft, [k]: v });

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please choose a valid photo (JPG, PNG, WebP)', 'error');
      return;
    }
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      set('image', compressed);
      toast('Photo loaded from gallery! Click Save to apply.', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to load image from device', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const save = () => {
    const e: Record<string, string> = {};
    if (!draft.name.trim()) e.name = 'Name is required';
    if (!(draft.price > 0)) e.price = 'Price must be greater than zero';
    if (!draft.description.trim()) e.description = 'Add a short description';
    setErrors(e);
    if (Object.keys(e).length) return;
    actions.saveItem({ ...draft, name: draft.name.trim(), description: draft.description.trim() });
    toast('Menu updated');
    onClose();
  };

  const addGroup = () =>
    set('addonGroups', [
      ...draft.addonGroups,
      {
        id: uid('g_'),
        name: 'New option group',
        type: 'single',
        required: false,
        options: [{ id: uid('o_'), name: 'Option', price: 0 }],
      },
    ]);

  const updateGroup = (gid: string, patch: Partial<AddonGroup>) =>
    set(
      'addonGroups',
      draft.addonGroups.map((g) => (g.id === gid ? { ...g, ...patch } : g)),
    );

  return (
    <Sheet open={!!item} onClose={onClose} title={item?.name ? 'Edit item' : 'New menu item'} size="lg">
      <div className="max-h-[72vh] space-y-4 overflow-y-auto px-5 py-5">
        <div className="flex flex-col sm:flex-row gap-4 items-start rounded-2xl border border-line bg-cream/40 p-4">
          <div className="relative group shrink-0">
            <img
              src={draft.image}
              alt=""
              className="h-28 w-28 rounded-2xl border border-line object-cover shadow-sm bg-white"
            />
            <label
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/60 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
              title="Click to upload from gallery"
            >
              <Upload size={22} />
              <span className="text-[11px] font-bold mt-1">Change</span>
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                className="hidden"
                onChange={handleImageFile}
              />
            </label>
          </div>

          <div className="flex-1 w-full space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[12px] font-bold text-ink uppercase tracking-wider">Item Image</span>
              <label
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 px-3 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
              >
                <Upload size={14} />
                <span>{uploading ? 'Processing photo...' : '📁 Upload from Gallery / Files'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  className="hidden"
                  onChange={handleImageFile}
                />
              </label>
            </div>

            <Field label="Image URL or Path">
              <input
                className={inputCx}
                value={draft.image.startsWith('data:') ? 'Custom uploaded image (from your gallery/files)' : draft.image}
                onChange={(e) => set('image', e.target.value)}
                placeholder="https://... or upload photo from device"
              />
            </Field>

            <div>
              <p className="text-[11px] text-mocha mb-1 font-medium">Or choose from preset cafe photos:</p>
              <div className="flex flex-wrap gap-1.5 items-center">
                {IMAGE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set('image', p)}
                    className={`h-10 w-10 overflow-hidden rounded-lg border-2 transition cursor-pointer ${
                      draft.image === p ? 'border-ember scale-105 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={p} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
                <label
                  className="grid h-10 w-10 place-items-center rounded-lg border-2 border-dashed border-amber-500/50 bg-amber-500/10 text-amber-900 hover:bg-amber-500/20 cursor-pointer transition shadow-xs"
                  title="Upload from device gallery or files"
                >
                  <Upload size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    className="hidden"
                    onChange={handleImageFile}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" error={errors.name}>
            <input className={inputCx} value={draft.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Category">
            <select
              className={inputCx}
              value={draft.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Description" error={errors.description}>
          <textarea
            rows={2}
            className={`${inputCx} resize-none`}
            value={draft.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Price" error={errors.price}>
            <input
              type="number"
              min={0}
              className={inputCx}
              value={draft.price}
              onChange={(e) => set('price', Number(e.target.value))}
            />
          </Field>
          <Field label="Prep minutes">
            <input
              type="number"
              min={1}
              className={inputCx}
              value={draft.prepMins}
              onChange={(e) => set('prepMins', Number(e.target.value))}
            />
          </Field>
          <Field label="Tags" hint="comma separated">
            <input
              className={inputCx}
              value={draft.tags.join(', ')}
              onChange={(e) =>
                set(
                  'tags',
                  e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                )
              }
            />
          </Field>
        </div>

        <div className="grid gap-2 rounded-2xl border border-line bg-cream/40 p-4 sm:grid-cols-3">
          <SwitchRow label="Vegetarian" on={draft.veg} onChange={(v) => set('veg', v)} />
          <SwitchRow label="Popular" on={!!draft.popular} onChange={(v) => set('popular', v)} />
          <SwitchRow label="Sold out" on={!!draft.soldOut} onChange={(v) => set('soldOut', v)} />
        </div>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-display text-[16px] font-semibold">Customisation groups</h4>
            <Button size="sm" variant="outline" onClick={addGroup}>
              <Plus size={13} /> Add group
            </Button>
          </div>
          <div className="space-y-3">
            {draft.addonGroups.length === 0 && (
              <p className="rounded-2xl border border-dashed border-line px-4 py-5 text-center text-[13px] text-mocha">
                No add-ons yet. Groups let guests pick sizes, milks, spice levels and extras.
              </p>
            )}
            {draft.addonGroups.map((g) => (
              <div key={g.id} className="rounded-2xl border border-line bg-paper p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="flex-1 rounded-xl border border-line px-3 py-2 text-[14px] font-semibold outline-none focus:border-ember"
                    value={g.name}
                    onChange={(e) => updateGroup(g.id, { name: e.target.value })}
                  />
                  <select
                    className="rounded-xl border border-line px-2.5 py-2 text-[13px] outline-none focus:border-ember"
                    value={g.type}
                    onChange={(e) => updateGroup(g.id, { type: e.target.value as 'single' | 'multi' })}
                  >
                    <option value="single">Pick one</option>
                    <option value="multi">Pick many</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-[12px] font-semibold text-mocha">
                    <input
                      type="checkbox"
                      checked={!!g.required}
                      onChange={(e) => updateGroup(g.id, { required: e.target.checked })}
                      className="h-4 w-4 accent-[#c2571f]"
                    />
                    Required
                  </label>
                  <button
                    onClick={() =>
                      set(
                        'addonGroups',
                        draft.addonGroups.filter((x) => x.id !== g.id),
                      )
                    }
                    className="grid h-8 w-8 place-items-center rounded-lg text-mocha hover:bg-berry/10 hover:text-berry"
                  >
                    <X size={15} />
                  </button>
                </div>
                <div className="mt-2 space-y-1.5">
                  {g.options.map((o) => (
                    <div key={o.id} className="flex items-center gap-2">
                      <input
                        className="flex-1 rounded-lg border border-line px-3 py-1.5 text-[13px] outline-none focus:border-ember"
                        value={o.name}
                        onChange={(e) =>
                          updateGroup(g.id, {
                            options: g.options.map((x) =>
                              x.id === o.id ? { ...x, name: e.target.value } : x,
                            ),
                          })
                        }
                      />
                      <input
                        type="number"
                        className="w-24 rounded-lg border border-line px-3 py-1.5 text-[13px] outline-none focus:border-ember"
                        value={o.price}
                        onChange={(e) =>
                          updateGroup(g.id, {
                            options: g.options.map((x) =>
                              x.id === o.id ? { ...x, price: Number(e.target.value) } : x,
                            ),
                          })
                        }
                      />
                      <button
                        onClick={() =>
                          updateGroup(g.id, { options: g.options.filter((x) => x.id !== o.id) })
                        }
                        className="grid h-8 w-8 place-items-center rounded-lg text-mocha hover:bg-berry/10 hover:text-berry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      updateGroup(g.id, {
                        options: [...g.options, { id: uid('o_'), name: 'New option', price: 0 }],
                      })
                    }
                    className="text-[12px] font-bold text-ember hover:underline"
                  >
                    + Add option
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="flex gap-2 border-t border-line px-5 py-4">
        <Button variant="ghost" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button onClick={save} className="flex-1">
          Save item
        </Button>
      </div>
    </Sheet>
  );
}

function SwitchRow({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-paper px-3 py-2">
      <span className="text-[13px] font-semibold">{label}</span>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

/* ----------------------------- category manager ---------------------------- */

function CategoryManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const categories = useCategories();
  const items = useItems();
  const toast = useToast();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🍽️');

  const add = () => {
    if (!name.trim()) return;
    const cat: Category = {
      id: uid('c_'),
      name: name.trim(),
      emoji: emoji || '🍽️',
      sort: categories.length + 1,
    };
    actions.saveCategory(cat);
    setName('');
    toast('Category added');
  };

  return (
    <Sheet open={open} onClose={onClose} title="Menu categories">
      <div className="max-h-[65vh] space-y-3 overflow-y-auto px-5 py-5">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-2 rounded-2xl border border-line bg-paper p-2.5">
            <input
              className="w-14 rounded-xl border border-line px-2 py-2 text-center text-[18px] outline-none focus:border-ember"
              value={c.emoji}
              onChange={(e) => actions.saveCategory({ ...c, emoji: e.target.value })}
            />
            <input
              className="flex-1 rounded-xl border border-line px-3 py-2 text-[14px] font-semibold outline-none focus:border-ember"
              value={c.name}
              onChange={(e) => actions.saveCategory({ ...c, name: e.target.value })}
            />
            <span className="text-[12px] font-semibold text-mocha">
              {items.filter((i) => i.categoryId === c.id).length}
            </span>
            <button
              onClick={() => {
                if (confirm(`Delete “${c.name}” and all of its items?`)) {
                  actions.deleteCategory(c.id);
                  toast('Category removed', 'info');
                }
              }}
              className="grid h-9 w-9 place-items-center rounded-xl text-mocha hover:bg-berry/10 hover:text-berry"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        <div className="flex items-center gap-2 rounded-2xl border border-dashed border-line p-2.5">
          <input
            className="w-14 rounded-xl border border-line px-2 py-2 text-center text-[18px] outline-none focus:border-ember"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
          />
          <input
            className="flex-1 rounded-xl border border-line px-3 py-2 text-[14px] outline-none focus:border-ember"
            placeholder="New category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <Button size="sm" onClick={add}>
            Add
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
