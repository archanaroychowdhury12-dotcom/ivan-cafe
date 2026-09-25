import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  ChefHat,
  ClipboardList,
  LogOut,
  Megaphone,
  QrCode,
  Settings as SettingsIcon,
  UtensilsCrossed,
} from 'lucide-react';
import { auth, useSession } from '../../lib/auth';
import { useOrders, useSettings } from '../../lib/store';
import AdminLogin from './AdminLogin';
import OrdersPanel from './OrdersPanel';
import MenuPanel from './MenuPanel';
import TablesPanel from './TablesPanel';
import OffersPanel from './OffersPanel';
import AnalyticsPanel from './AnalyticsPanel';
import SettingsPanel from './SettingsPanel';
import { Mark } from '../../components/Brand';

const TABS = [
  { id: 'orders', label: 'Live orders', icon: ClipboardList },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'tables', label: 'Tables & QR', icon: QrCode },
  { id: 'offers', label: 'Special Offers', icon: Megaphone },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function Admin() {
  const session = useSession();
  const settings = useSettings();
  const orders = useOrders();
  const [tab, setTab] = useState<TabId>('orders');

  if (!session) return <AdminLogin />;

  const activeCount = orders.filter((o) => !['SERVED', 'CANCELLED'].includes(o.status)).length;

  return (
    <div className="flex min-h-dvh">
      {/* ------------------------------- sidebar ------------------------------- */}
      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-line bg-espresso px-4 py-5 text-cream lg:flex">
        <Link to="/" className="flex items-center gap-3 px-1.5">
          <Mark size={40} tone="dark" />
          <div>
            <p className="font-display text-[16px] font-semibold leading-tight">{settings.cafeName}</p>
            <p className="text-[11px] text-cream/50">Manager console</p>
          </div>
        </Link>

        <nav className="mt-7 space-y-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-[14px] font-semibold transition ${
                  active ? 'bg-cream text-espresso' : 'text-cream/70 hover:bg-cream/10'
                }`}
              >
                <Icon size={17} />
                {t.label}
                {t.id === 'orders' && activeCount > 0 && (
                  <span
                    className={`ml-auto grid h-6 min-w-6 place-items-center rounded-lg px-1.5 text-[11px] font-bold ${
                      active ? 'bg-ember text-white' : 'bg-ember text-white'
                    }`}
                  >
                    {activeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2">
          <Link
            to="/kitchen"
            className="flex items-center gap-3 rounded-2xl border border-cream/15 px-3.5 py-3 text-[14px] font-semibold text-cream/80 transition hover:bg-cream/10"
          >
            <ChefHat size={17} /> Kitchen display
          </Link>
          <button
            onClick={() => auth.logout()}
            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-[14px] font-semibold text-cream/60 transition hover:bg-berry/20 hover:text-cream"
          >
            <LogOut size={17} /> Sign out ({session.user})
          </button>
        </div>
      </aside>

      {/* -------------------------------- content ------------------------------ */}
      <div className="min-w-0 flex-1 pb-24 lg:pb-8">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-cream/85 px-4 py-3.5 backdrop-blur-lg lg:px-8">
          <Link to="/" className="lg:hidden">
            <Mark size={36} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[20px] font-semibold leading-tight">
              {TABS.find((t) => t.id === tab)?.label}
            </h1>
            <p className="truncate text-[11px] font-medium text-mocha">
              {settings.cafeName} · {activeCount} active order{activeCount === 1 ? '' : 's'} on the floor
            </p>
          </div>
          <Link
            to="/kitchen"
            className="hidden items-center gap-1.5 rounded-xl border border-line bg-paper px-3.5 py-2 text-[13px] font-semibold transition hover:border-ember hover:text-ember sm:flex lg:hidden"
          >
            <ChefHat size={15} /> Kitchen
          </Link>
          <button
            onClick={() => auth.logout()}
            className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-paper text-mocha transition hover:text-berry lg:hidden"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </header>

        <motion.main
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mx-auto max-w-[1400px] px-4 py-5 lg:px-8"
        >
          {tab === 'orders' && <OrdersPanel />}
          {tab === 'menu' && <MenuPanel />}
          {tab === 'tables' && <TablesPanel />}
          {tab === 'offers' && <OffersPanel />}
          {tab === 'analytics' && <AnalyticsPanel />}
          {tab === 'settings' && <SettingsPanel />}
        </motion.main>
      </div>

      {/* ------------------------------ mobile tabs ---------------------------- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-paper/95 backdrop-blur-lg lg:hidden safe-bottom">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition ${
                active ? 'text-ember' : 'text-mocha'
              }`}
            >
              <Icon size={19} />
              {t.id === 'offers' ? 'Offers' : t.label.split(' ')[0]}
              {t.id === 'orders' && activeCount > 0 && (
                <span className="absolute right-1/4 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-ember px-1 text-[9px] text-white">
                  {activeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
