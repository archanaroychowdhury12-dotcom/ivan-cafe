import { useMemo, useState } from 'react';
import { BarChart3, IndianRupee, MessageSquare, Receipt, Sparkles, Star, TrendingUp, Trophy } from 'lucide-react';
import { useItems, useOrders, useSettings } from '../../lib/store';
import { clockTime, dayLabel, money } from '../../lib/format';
import { StatusPill } from '../../components/status';
import { Chip, EmptyState } from '../../components/ui';
import { getTopLovedDishes, getAllCustomerReviews } from '../../lib/reviews';

type Range = 'today' | '7d' | 'all';

export default function AnalyticsPanel() {
  const items = useItems();
  const orders = useOrders();
  const settings = useSettings();
  const [range, setRange] = useState<Range>('today');

  const topLoved = useMemo(() => getTopLovedDishes(items, orders, 6), [items, orders]);
  const recentDinerReviews = useMemo(() => getAllCustomerReviews(orders).slice(0, 6), [orders]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return orders.filter((o) => {
      if (o.status === 'CANCELLED') return false;
      if (range === 'today') return new Date(o.createdAt).toDateString() === new Date().toDateString();
      if (range === '7d') return now - o.createdAt < 7 * 86400000;
      return true;
    });
  }, [orders, range]);

  const revenue = filtered.reduce((s, o) => s + o.total, 0);
  const avg = filtered.length ? revenue / filtered.length : 0;
  const itemsSold = filtered.reduce((s, o) => s + o.lines.reduce((n, l) => n + l.qty, 0), 0);

  const topItems = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    filtered.forEach((o) =>
      o.lines.forEach((l) => {
        const cur = map.get(l.name) ?? { name: l.name, qty: 0, revenue: 0 };
        cur.qty += l.qty;
        cur.revenue += l.qty * l.unitPrice;
        map.set(l.name, cur);
      }),
    );
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 6);
  }, [filtered]);

  const hourly = useMemo(() => {
    const buckets = Array.from({ length: 12 }, (_, i) => ({ hour: i + 9, total: 0 }));
    filtered.forEach((o) => {
      const h = new Date(o.createdAt).getHours();
      const b = buckets.find((x) => x.hour === h);
      if (b) b.total += o.total;
      else if (h < 9) buckets[0].total += o.total;
      else buckets[buckets.length - 1].total += o.total;
    });
    return buckets;
  }, [filtered]);

  const maxHour = Math.max(1, ...hourly.map((h) => h.total));
  const byTable = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((o) => map.set(o.tableCode, (map.get(o.tableCode) ?? 0) + o.total));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filtered]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] font-semibold">Sales & performance</h2>
          <p className="text-[13px] text-mocha">Everything the counter needs to close the day.</p>
        </div>
        <div className="flex gap-2">
          {(['today', '7d', 'all'] as Range[]).map((r) => (
            <Chip key={r} active={range === r} onClick={() => setRange(r)}>
              {r === 'today' ? 'Today' : r === '7d' ? 'Last 7 days' : 'All time'}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KPI label="Revenue" value={money(revenue, settings.currency)} icon={<IndianRupee size={17} />} />
        <KPI label="Orders" value={String(filtered.length)} icon={<Receipt size={17} />} />
        <KPI label="Avg order" value={money(avg, settings.currency)} icon={<TrendingUp size={17} />} />
        <KPI label="Items sold" value={String(itemsSold)} icon={<BarChart3 size={17} />} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BarChart3 size={22} />}
          title="No sales in this window"
          sub="Place an order from a table QR (or seed demo orders in Settings) to see analytics come alive."
        />
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            <section className="rounded-[26px] border border-line bg-paper p-5 shadow-card">
              <h3 className="mb-4 font-display text-[17px] font-semibold">Revenue by hour</h3>
              <div className="flex h-44 items-end gap-1.5">
                {hourly.map((h) => (
                  <div key={h.hour} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-ember-soft to-ember transition-all duration-700"
                        style={{ height: `${Math.max(3, (h.total / maxHour) * 100)}%` }}
                        title={money(h.total, settings.currency)}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-mocha">{h.hour}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[26px] border border-line bg-paper p-5 shadow-card">
              <h3 className="mb-4 flex items-center gap-2 font-display text-[17px] font-semibold">
                <Trophy size={16} className="text-gold" /> Best sellers
              </h3>
              <div className="space-y-2.5">
                {topItems.map((t, i) => (
                  <div key={t.name} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-cream-deep text-[12px] font-bold">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{t.name}</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream-deep">
                        <div
                          className="h-full rounded-full bg-ember"
                          style={{ width: `${(t.qty / topItems[0].qty) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold">{t.qty} sold</p>
                      <p className="text-[11px] text-mocha">{money(t.revenue, settings.currency)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Customer Ratings & Most Loved Dishes */}
          <div className="grid gap-3 lg:grid-cols-2">
            {/* 1. Most Loved Dishes Leaderboard */}
            <section className="rounded-[26px] border border-line bg-paper p-5 shadow-card space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/15 text-amber-600">
                    <Star size={18} className="fill-amber-500 text-amber-500" />
                  </span>
                  <div>
                    <h3 className="font-display text-[17px] font-semibold text-stone-900 leading-tight">
                      Most Loved Dishes
                    </h3>
                    <p className="text-[11.5px] text-mocha">Ranked by diner ratings & satisfaction</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 border border-amber-200">
                  Diner Favorite
                </span>
              </div>

              <div className="space-y-2.5">
                {topLoved.map(({ item, stats }, i) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-2xl bg-cream/40 border border-line/60 hover:bg-cream/70 transition"
                  >
                    <span className={`grid h-7 w-7 place-items-center rounded-lg text-[12px] font-bold ${
                      i === 0
                        ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                        : i === 1
                          ? 'bg-stone-300 text-stone-800'
                          : i === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-cream-deep text-mocha'
                    }`}>
                      {i + 1}
                    </span>

                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-11 w-11 rounded-xl object-cover border border-line shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold text-stone-900">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-bold text-amber-800 flex items-center gap-0.5">
                          <Star size={10} className="fill-amber-500 text-amber-500" />
                          {stats.averageRating}
                        </span>
                        <span className="text-[10px] text-mocha">
                          ({stats.totalReviews} reviews)
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                          {stats.satisfactionPercent}% Loved
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-display text-[14px] font-bold text-stone-800">
                        {money(item.price, settings.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Live Customer Feedback Feed */}
            <section className="rounded-[26px] border border-line bg-paper p-5 shadow-card space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/15 text-blue-600">
                    <MessageSquare size={17} />
                  </span>
                  <div>
                    <h3 className="font-display text-[17px] font-semibold text-stone-900 leading-tight">
                      Recent Diner Feedback
                    </h3>
                    <p className="text-[11.5px] text-mocha">Live ratings from served customer orders</p>
                  </div>
                </div>
                <span className="rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 border border-blue-200">
                  Live Feed
                </span>
              </div>

              {recentDinerReviews.length === 0 ? (
                <div className="text-center py-8 text-xs text-mocha bg-stone-50 rounded-2xl border border-stone-200/60">
                  Customer reviews submitted after meals are served will appear here live.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {recentDinerReviews.map((rev, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-2xl border border-line/70 bg-cream/30 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="rounded-md bg-stone-800 text-white text-[10px] font-bold px-1.5 py-0.5">
                            {rev.tableCode}
                          </span>
                          <span className="text-[12.5px] font-bold text-stone-900 truncate">
                            {rev.itemName}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={11}
                              className={
                                s <= rev.rating ? 'fill-amber-500 text-amber-500' : 'text-stone-200'
                              }
                            />
                          ))}
                        </div>
                      </div>

                      {rev.comment && (
                        <p className="text-[11.5px] text-stone-600 italic bg-white/80 p-2 rounded-xl border border-stone-150">
                          "{rev.comment}"
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-mocha">
                        <span>By {rev.customerName}</span>
                        <span>{dayLabel(rev.createdAt)} · {clockTime(rev.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="rounded-[26px] border border-line bg-paper p-5 shadow-card">
            <h3 className="mb-3 font-display text-[17px] font-semibold">Top tables</h3>
            <div className="flex flex-wrap gap-2">
              {byTable.map(([code, total]) => (
                <div key={code} className="rounded-2xl border border-line bg-cream/50 px-4 py-2.5">
                  <p className="font-display text-[16px] font-semibold">{code}</p>
                  <p className="text-[12px] text-mocha">{money(total, settings.currency)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-[26px] border border-line bg-paper shadow-card">
            <h3 className="border-b border-line px-5 py-4 font-display text-[17px] font-semibold">
              Order history
            </h3>
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="sticky top-0 bg-cream/80 backdrop-blur">
                  <tr className="text-[11px] uppercase tracking-[0.1em] text-mocha">
                    <th className="px-5 py-2.5 font-bold">Order</th>
                    <th className="px-3 py-2.5 font-bold">Table</th>
                    <th className="px-3 py-2.5 font-bold">Items</th>
                    <th className="px-3 py-2.5 font-bold">Time</th>
                    <th className="px-3 py-2.5 font-bold">Status</th>
                    <th className="px-5 py-2.5 text-right font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id} className="border-t border-line/60">
                      <td className="px-5 py-3 font-semibold">{o.code}</td>
                      <td className="px-3 py-3">{o.tableCode}</td>
                      <td className="px-3 py-3 text-mocha">
                        {o.lines.reduce((s, l) => s + l.qty, 0)} items
                      </td>
                      <td className="px-3 py-3 text-mocha">
                        {dayLabel(o.createdAt)} · {clockTime(o.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill status={o.status} size="sm" />
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">
                        {money(o.total, settings.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function KPI({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-line bg-paper p-5 shadow-card">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ember-soft text-ember-deep">
        {icon}
      </span>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-mocha">{label}</p>
      <p className="font-display text-[26px] font-semibold leading-tight">{value}</p>
    </div>
  );
}
