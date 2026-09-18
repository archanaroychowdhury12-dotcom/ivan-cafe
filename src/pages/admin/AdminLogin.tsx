import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck, User } from 'lucide-react';
import { auth } from '../../lib/auth';
import { Button, Field, inputCx } from '../../components/ui';
import { Mark } from '../../components/Brand';
import { useSettings } from '../../lib/store';

export default function AdminLogin() {
  const settings = useSettings();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.trim() || !pass) {
      setError('Enter both username and password.');
      return;
    }
    setBusy(true);
    setError('');
    await new Promise((r) => setTimeout(r, 450));
    const res = await auth.login(user, pass);
    if (!res.ok) setError(res.error);
    setBusy(false);
  };

  return (
    <div className="grid min-h-dvh place-items-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-mocha transition hover:text-ink"
        >
          <ArrowLeft size={14} /> Back to {settings.cafeName}
        </Link>

        <div className="grain relative overflow-hidden rounded-[30px] border border-line bg-paper p-7 shadow-lift">
          <div className="flex items-center gap-3">
            <Mark size={46} />
            <div>
              <h1 className="font-display text-[22px] font-semibold leading-tight">Staff sign in</h1>
              <p className="text-[12px] text-mocha">Counter & manager dashboard</p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Username">
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-mocha" />
                <input
                  className={`${inputCx} pl-11`}
                  value={user}
                  autoComplete="username"
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="admin"
                />
              </div>
            </Field>
            <Field label="Password">
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-mocha" />
                <input
                  className={`${inputCx} pl-11 pr-12`}
                  type={show ? 'text' : 'password'}
                  value={pass}
                  autoComplete="current-password"
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-mocha transition hover:bg-cream-deep"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            {error && (
              <p className="rounded-xl bg-berry/10 px-3 py-2 text-[13px] font-semibold text-berry">{error}</p>
            )}

            <Button full size="lg" loading={busy} type="submit">
              Sign in to dashboard
            </Button>
          </form>

          <div className="mt-5 rounded-2xl bg-[#FBF7F0] border border-[#EADECE] p-4 text-[13px] text-stone-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-emerald-700 shrink-0" />
                <span className="font-bold text-stone-900 text-[13px]">Admin Access Credentials</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white border border-stone-200/80 p-3 my-2 shadow-xs">
              <div className="space-y-1 text-xs">
                <p className="text-stone-500 flex items-center gap-1.5">
                  <span>Username:</span>
                  <strong className="text-stone-900 font-mono font-bold text-[13px] bg-stone-100 px-2 py-0.5 rounded">
                    {settings.adminUser || 'admin'}
                  </strong>
                </p>
                <p className="text-stone-500 flex items-center gap-1.5">
                  <span>Password:</span>
                  <strong className="text-stone-900 font-mono font-bold text-[13px] bg-stone-100 px-2 py-0.5 rounded">
                    {settings.adminPass || 'ivan2026'}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUser(settings.adminUser || 'admin');
                  setPass(settings.adminPass || 'ivan2026');
                  setError('');
                }}
                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 px-3 py-2 text-xs font-bold transition active:scale-95 shadow-xs shrink-0 cursor-pointer"
                title="Click to automatically fill credentials"
              >
                Auto-Fill
              </button>
            </div>

            <p className="text-[11px] text-stone-500 leading-tight">
              🔒 The password is always displayed here for quick access. You can also sign in with <strong className="text-stone-800">admin / ivan2026</strong> anytime.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
