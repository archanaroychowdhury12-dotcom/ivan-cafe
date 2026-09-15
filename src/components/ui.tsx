import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2, Check, AlertCircle, Info } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

/* --------------------------------- Button --------------------------------- */

type BtnProps = {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'outline' | 'dark' | 'danger' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  full?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const variants: Record<string, string> = {
  primary:
    'bg-ember text-white hover:bg-ember-deep shadow-[0_10px_24px_-12px_rgba(194,87,31,0.9)] disabled:bg-mocha/40 disabled:shadow-none',
  dark: 'bg-ink text-cream hover:bg-ink-soft',
  outline: 'border border-line bg-paper text-ink hover:border-ember hover:text-ember',
  ghost: 'text-ink-soft hover:bg-cream-deep',
  soft: 'bg-ember-soft text-ember-deep hover:bg-ember/15',
  danger: 'bg-berry text-white hover:brightness-110',
};

const sizes: Record<string, string> = {
  sm: 'h-9 px-3.5 text-[13px] rounded-xl',
  md: 'h-11 px-5 text-sm rounded-2xl',
  lg: 'h-14 px-6 text-[15px] rounded-2xl',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  full,
  className = '',
  disabled,
  ...rest
}: BtnProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70 ${variants[variant]} ${sizes[size]} ${full ? 'w-full' : ''} ${className}`}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

/* ---------------------------------- Chip ---------------------------------- */

export function Chip({
  children,
  active,
  onClick,
  className = '',
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-200 active:scale-95 ${
        active
          ? 'bg-ink text-cream shadow-card'
          : 'bg-paper text-ink-soft border border-line hover:border-mocha/50'
      } ${className}`}
    >
      {children}
    </button>
  );
}

/* --------------------------------- Sheet ---------------------------------- */

export function Sheet({
  open,
  onClose,
  children,
  title,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'md' | 'lg';
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', esc);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/50 backdrop-blur-[3px]"
          />
          <motion.div
            initial={{ y: '4%', opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '4%', opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className={`relative flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-paper shadow-lift sm:rounded-[28px] ${
              size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg'
            }`}
          >
            {title && (
              <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
                <h3 className="font-display text-xl font-semibold">{title}</h3>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="grid h-9 w-9 place-items-center rounded-full bg-cream-deep text-ink-soft transition hover:bg-line"
                >
                  <X size={17} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* --------------------------------- Toasts --------------------------------- */

type Toast = { id: number; msg: string; kind: 'success' | 'error' | 'info' };
const ToastCtx = createContext<(msg: string, kind?: Toast['kind']) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastHost({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((msg: string, kind: Toast['kind'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  const value = useMemo(() => push, [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                className="pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-cream shadow-lift"
              >
                {t.kind === 'success' && <Check size={16} className="text-olive" />}
                {t.kind === 'error' && <AlertCircle size={16} className="text-ember" />}
                {t.kind === 'info' && <Info size={16} className="text-gold" />}
                {t.msg}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}

/* -------------------------------- Fragments ------------------------------- */

export function EmptyState({
  icon,
  title,
  sub,
  action,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-line bg-paper/60 px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cream-deep text-mocha">{icon}</div>
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {sub && <p className="max-w-xs text-sm text-mocha">{sub}</p>}
      {action}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-[12px] font-bold uppercase tracking-[0.12em] text-mocha">
        {label}
        {hint && <span className="normal-case tracking-normal text-[11px] font-medium">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-berry">{error}</span>}
    </label>
  );
}

export const inputCx =
  'w-full rounded-2xl border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-mocha/60 focus:border-ember focus:ring-4 focus:ring-ember/10';

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${on ? 'bg-olive' : 'bg-line'}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${on ? 'left-6' : 'left-1'}`}
      />
    </button>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-mocha">
      <Loader2 className="animate-spin text-ember" size={26} />
      {label && <p className="text-sm font-medium">{label}</p>}
    </div>
  );
}
