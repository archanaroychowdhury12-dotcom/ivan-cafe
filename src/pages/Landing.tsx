import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ChefHat,
  LayoutDashboard,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Timer,
} from 'lucide-react';
import { useSettings, useTables } from '../lib/store';
import { BrandLockup, Mark } from '../components/Brand';
import { QRImage } from '../components/QRCode';
import { getLiveMenuUrl } from '../lib/format';

const STEPS = [
  { icon: ScanLine, title: 'Scan', text: 'Guest scans the QR sticker on their table.' },
  { icon: Smartphone, title: 'Order', text: 'Browse, customise, add to tray — no app, no login.' },
  { icon: ChefHat, title: 'Cook', text: 'Ticket appears on the kitchen display instantly.' },
  { icon: Timer, title: 'Track', text: 'Guest watches status move from received to served.' },
];

export default function Landing() {
  const settings = useSettings();
  const tables = useTables().filter((t) => t.active);
  const featuredTable = tables[0]?.code ?? 'T01';
  const qrLink = getLiveMenuUrl(featuredTable, settings.customDomain);

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <BrandLockup name={settings.cafeName} tagline={settings.tagline} />
        <nav className="flex items-center gap-2">
          <Link
            to="/kitchen"
            className="hidden rounded-xl px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition hover:bg-cream-deep sm:block"
          >
            Kitchen
          </Link>
          <Link
            to="/admin"
            className="rounded-xl bg-ink px-4 py-2 text-[13px] font-semibold text-cream transition hover:bg-ink-soft"
          >
            Admin
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto max-w-6xl px-5">
        <div className="grain texture relative overflow-hidden rounded-[36px] border border-line bg-paper px-6 py-12 shadow-lift sm:px-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-cream px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ember-deep">
              <Sparkles size={12} /> QR ordering system
            </span>
            <h1 className="mt-5 font-display text-[44px] font-semibold leading-[1.05] text-ink sm:text-[64px]">
              Table to kitchen,
              <br />
              <span className="text-ember">in one scan.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-ink-soft">
              {settings.cafeName} runs a complete contactless service floor — guests scan, customise and pay,
              the kitchen cooks from live tickets, and the counter watches everything from one dashboard.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to={`/menu?table=${tables[0]?.code ?? 'T01'}`}
                className="inline-flex h-14 items-center gap-2 rounded-2xl bg-ember px-6 text-[15px] font-semibold text-white shadow-[0_14px_30px_-14px_rgba(194,87,31,1)] transition hover:bg-ember-deep active:scale-95"
              >
                Open guest menu <ArrowRight size={17} />
              </Link>
              <Link
                to="/kitchen"
                className="inline-flex h-14 items-center gap-2 rounded-2xl border border-line bg-paper px-6 text-[15px] font-semibold text-ink transition hover:border-ember hover:text-ember active:scale-95"
              >
                <ChefHat size={17} /> Kitchen display
              </Link>
              <Link
                to="/admin"
                className="inline-flex h-14 items-center gap-2 rounded-2xl border border-line bg-paper px-6 text-[15px] font-semibold text-ink transition hover:border-ember hover:text-ember active:scale-95"
              >
                <LayoutDashboard size={17} /> Admin dashboard
              </Link>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-[12px] font-medium text-mocha">
              <ShieldCheck size={13} /> Admin demo credentials — user <strong className="text-ink">admin</strong>{' '}
              · password <strong className="text-ink">ivan2026</strong>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 6 }}
            animate={{ opacity: 1, scale: 1, rotate: 4 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="absolute -right-6 top-10 hidden w-[300px] rounded-[28px] border border-line bg-cream p-5 shadow-lift lg:block"
          >
            <div className="flex items-center justify-between">
              <Mark size={34} />
              <span className="rounded-full bg-ember-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-ember-deep">
                Table {featuredTable}
              </span>
            </div>
            <div className="mt-4 grid place-items-center rounded-2xl border border-line bg-paper p-4">
              <QRImage value={qrLink} size={168} />
            </div>
            <p className="mt-3 text-center font-display text-[15px] font-semibold">Scan to order</p>
            <p className="text-center font-mono text-[10px] text-ember truncate px-2">{qrLink}</p>
            <p className="text-center text-[11px] text-mocha">{settings.tagline}</p>

          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="font-display text-[28px] font-semibold">How a service runs</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-[26px] border border-line bg-paper p-5 shadow-card transition hover:-translate-y-1 hover:shadow-lift"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ember-soft text-ember-deep">
                <s.icon size={19} />
              </span>
              <p className="mt-3 font-display text-[18px] font-semibold">
                {i + 1}. {s.title}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-mocha">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="rounded-[32px] border border-line bg-paper p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-[26px] font-semibold">Try a table</h2>
              <p className="mt-1 text-[14px] text-mocha">
                These are the live QR codes from the admin dashboard. Tap one to open the guest menu for that
                table.
              </p>
            </div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ember hover:underline"
            >
              <QrCode size={14} /> Manage tables & print QR
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tables.map((t) => (
              <Link
                key={t.id}
                to={`/menu?table=${t.code}`}
                className="group flex flex-col items-center gap-2 rounded-[24px] border border-line bg-cream/50 p-4 transition hover:-translate-y-1 hover:border-ember hover:bg-paper hover:shadow-lift"
              >
                <div className="rounded-2xl bg-paper p-2 shadow-card">
                  <QRImage value={getLiveMenuUrl(t.code, settings.customDomain)} size={110} />
                </div>
                <p className="font-display text-[17px] font-semibold">{t.code}</p>
                <p className="-mt-1 text-[11px] text-mocha">{t.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-line px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <BrandLockup name={settings.cafeName} tagline={settings.address} size={34} />
          <p className="text-[12px] text-mocha">
            {settings.hours} · Built as a complete QR ordering workflow
          </p>
        </div>
      </footer>
    </div>
  );
}
