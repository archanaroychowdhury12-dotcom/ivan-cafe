import { useMemo, useState } from 'react';
import { BarChart3, IndianRupee, Receipt, TrendingUp, Trophy } from 'lucide-react';
import { useOrders, useSettings } from '../../lib/store';
import { clockTime, dayLabel, money } from '../../lib/format';
import { StatusPill } from '../../components/status';
import { Chip, EmptyState } from '../../components/ui';

type Range = 'today' | '7d' | 'all';

export default function AnalyticsPanel() {
  const orders = useOrders();
  const settings = useSettings();
  const [range, setRange] = useState<Range>('today');

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
