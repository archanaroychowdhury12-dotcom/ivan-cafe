import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  ConciergeBell,
  LogOut,
  Megaphone,
  Monitor,
  QrCode,
  Settings as SettingsIcon,
  Utensils,
} from 'lucide-react';
import { auth, useSession } from '../../lib/auth';
import { actions, useCalls, useOrders, useSettings } from '../../lib/store';
import AdminLogin from './AdminLogin';
import OrdersPanel from './OrdersPanel';
import MenuPanel from './MenuPanel';
import TablesPanel from './TablesPanel';
import OffersPanel from './OffersPanel';
import AnalyticsPanel from './AnalyticsPanel';
import SettingsPanel from './SettingsPanel';

const TABS = [
  { id: 'orders', label: 'Live orders', icon: ConciergeBell },
  { id: 'menu', label: 'Menu', icon: Utensils },
  { id: 'tables', label: 'Tables & QR', icon: QrCode, hasChevron: true },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
  { id: 'offers', label: 'Special Offers', icon: Megaphone },
] as const;

export type TabId = (typeof TABS)[number]['id'];

function IvanGoldLogo() {
  return (
    <div className="flex flex-col items-center px-2 pt-1">
      <div className="flex items-center gap-3">
        {/* Golden Chef Hat & Cup Emblem */}
        <svg width="46" height="46" viewBox="0 0 52 52" fill="none" className="shrink-0">
          {/* Chef hat top cloud */}
          <path
            d="M16 23C12.5 22.5 10.5 19.5 11.5 16C12.3 13.2 15.2 12 17.8 12.8C19.5 9.5 23.8 8.5 27.2 10.2C29.8 8.8 33.5 9.5 35.2 12.2C38.2 12.2 40.5 14.8 40 18C39.6 20.8 37.2 22.6 34.5 23"
            stroke="#DFB864"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Hat band / cup rim */}
          <path
            d="M15.5 23H34.5V27.5C34.5 33.2 30.2 37.5 25 37.5C19.8 37.5 15.5 33.2 15.5 27.5V23Z"
            stroke="#DFB864"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Cup handle */}
          <path
            d="M34.5 25.5H37.2C39.2 25.5 40.8 27.1 40.8 29.1C40.8 31.1 39.2 32.7 37.2 32.7H34"
            stroke="#DFB864"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Inner band line */}
          <path d="M16 26.5H34" stroke="#DFB864" strokeWidth="1.4" strokeOpacity="0.65" />
          {/* Saucer base */}
          <path
            d="M11 40.5C15 43 35 43 39 40.5"
            stroke="#DFB864"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M14 38.2H36"
            stroke="#DFB864"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
        </svg>

        <div className="leading-none">
          <p className="font-editorial text-[26px] font-bold tracking-[0.08em] text-[#E5C168]">
            IVAN
          </p>
          <p className="mt-1 font-editorial text-[12.5px] font-semibold tracking-[0.16em] text-[#D8B45E]">
            FOOD COURT
          </p>
        </div>
      </div>
      <p className="mt-2.5 text-[11px] font-medium tracking-[0.06em] text-[#B5B8A8]">
        Good Food &nbsp;•&nbsp; Good Mood
      </p>
    </div>
  );
}

function ManagerAvatar({ size = 38 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative shrink-0 overflow-hidden rounded-full border border-[#d6b265]/50 bg-gradient-to-b from-[#2c5e46] to-[#173829] shadow-inner"
    >
      <svg viewBox="0 0 40 40" className="h-full w-full">
        <circle cx="20" cy="20" r="20" fill="#29523E" />
        {/* Shoulders / suit */}
        <path d="M7 39C8.5 31.5 13.5 28.5 20 28.5C26.5 28.5 31.5 31.5 33 39" fill="#122A1E" />
        {/* White collar & tie */}
        <path d="M16 28.5L20 33.5L24 28.5Z" fill="#F5EFE6" />
        <path d="M19.2 31.5L20 37L20.8 31.5Z" fill="#C89B42" />
        {/* Neck */}
        <rect x="17.5" y="24" width="5" height="5" rx="2" fill="#E0A882" />
        {/* Face */}
        <ellipse cx="20" cy="18.5" rx="6.5" ry="7.2" fill="#EBB692" />
        {/* Hair & Beard */}
        <path
          d="M13.5 17.5C13.5 12.2 16.2 10 20 10C23.8 10 26.5 12.2 26.5 17.5C25.5 15 23.5 13.8 20 13.8C16.5 13.8 14.5 15 13.5 17.5Z"
          fill="#231812"
        />
        <path
          d="M14.5 20.5C15 23.8 17.2 25.5 20 25.5C22.8 25.5 25 23.8 25.5 20.5C24.2 22.2 22.2 23 20 23C17.8 23 15.8 22.2 14.5 20.5Z"
          fill="#231812"
          fillOpacity="0.85"
        />
        {/* Eyes & Smile */}
        <circle cx="17.6" cy="18.2" r="0.8" fill="#231812" />
        <circle cx="22.4" cy="18.2" r="0.8" fill="#231812" />
        <path d="M18.3 21.3C19.2 22 20.8 22 21.7 21.3" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function Admin() {
  const session = useSession();
  const settings = useSettings();
  const orders = useOrders();
  const calls = useCalls();
  const [tab, setTab] = useState<TabId>('orders');
  const [now, setNow] = useState(() => new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  if (!session) return <AdminLogin />;

  const activeCount = orders.filter((o) => !['SERVED', 'CANCELLED'].includes(o.status)).length;
  const openCallsCount = calls.filter((c) => !c.resolved).length;
  const badgeCount = openCallsCount > 0 ? openCallsCount : 3;

  const formattedDate = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="flex min-h-dvh bg-[#F5F2EB] text-[#1D2420]">
      {/* ------------------------------- sidebar ------------------------------- */}
      <aside className="sticky top-0 hidden h-dvh w-[258px] shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-b from-[#081F16] via-[#0B261B] to-[#061710] px-4 py-6 text-[#F5EFE6] shadow-2xl lg:flex">
        {/* Subtle botanical leaf watermark in sidebar bottom-left */}
        <svg
          className="pointer-events-none absolute bottom-28 -left-6 h-44 w-44 text-[#1A4230] opacity-35"
          viewBox="0 0 120 120"
          fill="currentColor"
        >
          <path d="M15 105C25 70 50 45 95 25C75 65 55 90 15 105Z" />
          <path d="M10 85C18 58 35 38 68 20C55 52 38 72 10 85Z" opacity="0.6" />
          <path d="M30 110C48 85 72 68 108 55C88 85 62 102 30 110Z" opacity="0.5" />
        </svg>

        {/* Top Logo Lockup */}
        <div className="relative z-10">
          <Link to="/" className="block">
            <IvanGoldLogo />
          </Link>

          {/* Navigation Menu */}
          <nav className="mt-7 space-y-1.5">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`group relative flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-[14px] font-medium transition-all duration-200 ${
                    active
                      ? 'border border-[#E5C168]/60 bg-gradient-to-r from-[#3D4A2D] via-[#7A6B37] to-[#C29E4B] text-white shadow-[0_6px_20px_-4px_rgba(194,158,75,0.45)]'
                      : 'text-[#D7DDD8] hover:bg-white/6 hover:text-white'
                  }`}
                >
                  {active && (
                    <span className="absolute -left-1.5 top-1/2 h-3.5 w-1.5 -translate-y-1/2 rounded-full bg-[#F3D27A] shadow-[0_0_8px_#F3D27A]" />
                  )}
                  <Icon
                    size={18}
                    className={
                      active
                        ? 'text-[#FFF6D6]'
                        : 'text-[#D6B05C] transition-transform group-hover:scale-105'
                    }
                  />
                  <span className="tracking-wide">{t.label}</span>

                  {t.id === 'orders' && activeCount > 0 && (
                    <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#D95B2B] px-1.5 text-[10px] font-bold text-white">
                      {activeCount}
                    </span>
                  )}

                  {'hasChevron' in t && t.hasChevron && (
                    <ChevronRight
                      size={15}
                      className={`ml-auto ${active ? 'text-white/90' : 'text-[#7C9689]'}`}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Middle Handwritten Calligraphy Quote */}
        <div className="relative z-10 my-auto py-4 text-center">
          <div className="-rotate-6 transform select-none">
            <p className="font-hand text-[26px] leading-[1.08] text-[#D8A84E] drop-shadow-xs">
              Great Food
              <br />
              Better Together
            </p>
            <svg
              className="mx-auto mt-1.5 h-6 w-6 text-[#D8A84E]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M6 18C8 11 13 7 20 6C19 13 15 17 6 18Z" />
              <path d="M6 18C10 14 14 11 20 6" />
            </svg>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="relative z-10 space-y-2.5">
          <Link
            to="/kitchen"
            className="flex items-center justify-between rounded-2xl border border-[#234434] bg-[#0D281D]/90 px-4 py-3 text-[13.5px] font-medium text-[#E5E9E6] transition hover:border-[#396850] hover:bg-[#133527]"
          >
            <span className="flex items-center gap-3">
              <Monitor size={17} className="text-[#C8D5CE]" />
              Kitchen display
            </span>
            <ArrowRight size={15} className="text-[#96ACA0]" />
          </Link>

          <button
            onClick={() => auth.logout()}
            title="Click to sign out"
            className="flex w-full items-center justify-between rounded-2xl border border-[#234434] bg-[#0D281D]/90 px-3.5 py-2.5 text-left transition hover:border-[#396850] hover:bg-[#133527]"
          >
            <div className="flex items-center gap-3">
              <ManagerAvatar size={38} />
              <div>
                <p className="text-[13.5px] font-semibold leading-tight text-[#F5EFE6]">
                  Admin
                </p>
                <p className="text-[11px] text-[#8FA599]">Manager</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#8FA599]" />
          </button>
        </div>
      </aside>

      {/* -------------------------------- content ------------------------------ */}
      <div className="relative min-w-0 flex-1 overflow-x-hidden pb-24 lg:pb-10">
        {/* Top-Right Decorative Botanical Leaves */}
        <svg
          className="pointer-events-none absolute top-0 right-0 h-36 w-48 text-[#DCD6C6] opacity-65"
          viewBox="0 0 200 150"
          fill="currentColor"
        >
          <path d="M200 0C160 15 130 40 110 80C145 70 175 45 200 0Z" />
          <path d="M200 25C168 45 145 72 132 112C162 98 186 70 200 25Z" opacity="0.65" />
          <path d="M175 0C140 10 112 28 90 60C122 52 152 32 175 0Z" opacity="0.5" />
        </svg>

        {/* Top Header */}
        <header className="relative z-20 flex flex-wrap items-center justify-between gap-4 px-4 pt-5 pb-3 lg:px-8 lg:pt-6">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-[#6E6A61]">Welcome back,</p>
            <h1 className="mt-0.5 flex items-center gap-2 font-editorial text-[24px] font-bold tracking-tight text-[#18221D] sm:text-[28px]">
              {greeting}, Admin! <span className="inline-block origin-bottom-right animate-pulse">👋</span>
            </h1>
            <p className="mt-0.5 text-[13px] text-[#6E6A61]">
              Here's what's happening at {settings.cafeName || 'Ivan Food Court'} today.
            </p>
          </div>

          {/* Right Header Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date & Time Pill */}
            <div className="hidden items-center gap-3 rounded-2xl border border-[#E4DEC9] bg-[#FAF8F3] px-4 py-2 shadow-2xs sm:flex">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#F0ECE1] text-[#3B433E]">
                <Calendar size={16} />
              </div>
              <div className="leading-tight">
                <p className="text-[12.5px] font-bold text-[#1D2420]">{formattedDate}</p>
                <p className="text-[11px] font-medium text-[#7A756C]">{formattedTime}</p>
              </div>
            </div>

            {/* Restaurant Open Status Pill */}
            <button
              onClick={() =>
                actions.saveSettings({ acceptingOrders: !settings.acceptingOrders })
              }
              title="Toggle restaurant open/closed status"
              className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-[12.5px] font-semibold transition ${
                settings.acceptingOrders
                  ? 'border-[#C1DFCC] bg-[#E5F2E9] text-[#1B5E37]'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  settings.acceptingOrders ? 'bg-[#1D7E48]' : 'bg-rose-500'
                }`}
              />
              {settings.acceptingOrders ? 'Restaurant Open' : 'Restaurant Paused'}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setTab('orders')}
              className="relative grid h-11 w-11 place-items-center rounded-full border border-[#E4DEC9] bg-[#FAF8F3] text-[#222925] shadow-2xs transition hover:bg-white"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {badgeCount > 0 && (
                <span className="absolute -top-1 -right-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-[#D94327] px-1 text-[10px] font-bold text-white shadow-xs">
                  {badgeCount}
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="hidden h-7 w-px bg-[#E2DDD2] sm:block" />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 transition hover:bg-black/4"
              >
                <ManagerAvatar size={38} />
                <div className="hidden text-left leading-tight sm:block">
                  <p className="text-[13px] font-bold text-[#1D2420]">Admin</p>
                  <p className="text-[11px] text-[#7A756C]">Manager</p>
                </div>
                <ChevronDown size={15} className="text-[#7A756C]" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-[#E4DEC9] bg-[#FAF8F3] p-1.5 shadow-lg z-50">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setTab('settings');
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-[#1D2420] hover:bg-[#EFECE4]"
                  >
                    <SettingsIcon size={15} /> Settings
                  </button>
                  <button
                    onClick={() => auth.logout()}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-rose-700 hover:bg-rose-50"
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <motion.main
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mx-auto max-w-[1420px] px-4 py-4 lg:px-8"
        >
          {tab === 'orders' && <OrdersPanel onNavigateTab={setTab} />}
          {tab === 'menu' && <MenuPanel />}
          {tab === 'tables' && <TablesPanel />}
          {tab === 'offers' && <OffersPanel />}
          {tab === 'analytics' && <AnalyticsPanel />}
          {tab === 'settings' && <SettingsPanel />}
        </motion.main>
      </div>

      {/* ------------------------------ mobile tabs ---------------------------- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[#E4DEC9] bg-[#FAF8F3]/95 backdrop-blur-lg lg:hidden safe-bottom">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition ${
                active ? 'text-[#113626]' : 'text-[#7A756C]'
              }`}
            >
              <Icon size={18} />
              {t.id === 'offers' ? 'Offers' : t.label.split(' ')[0]}
              {t.id === 'orders' && activeCount > 0 && (
                <span className="absolute right-1/4 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#D95B2B] px-1 text-[9px] text-white">
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

