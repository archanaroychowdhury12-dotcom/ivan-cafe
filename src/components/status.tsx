import { BellRing, ChefHat, CheckCircle2, ClipboardCheck, HandPlatter, XCircle } from 'lucide-react';
import type { OrderStatus } from '../lib/types';

export const STATUS_META: Record<
  OrderStatus,
  { label: string; blurb: string; icon: typeof BellRing; chip: string; dot: string; solid: string }
> = {
  RECEIVED: {
    label: 'Received',
    blurb: 'Your order landed at the counter',
    icon: BellRing,
    chip: 'bg-gold/15 text-[#8a6a1f] border-gold/30',
    dot: 'bg-gold',
    solid: 'bg-gold text-ink',
  },
  CONFIRMED: {
    label: 'Confirmed',
    blurb: 'The counter accepted your order',
    icon: ClipboardCheck,
    chip: 'bg-[#3b6ea5]/12 text-[#2f5a86] border-[#3b6ea5]/25',
    dot: 'bg-[#3b6ea5]',
    solid: 'bg-[#3b6ea5] text-white',
  },
  PREPARING: {
    label: 'Kitchen Cooking',
    blurb: 'Sent straight to the kitchen — Chef is cooking your food now',
    icon: ChefHat,
    chip: 'bg-ember/12 text-ember-deep border-ember/25',
    dot: 'bg-ember',
    solid: 'bg-ember text-white',
  },
  READY: {
    label: 'Food Ready',
    blurb: 'Freshly prepared and ready to serve / collect',
    icon: HandPlatter,
    chip: 'bg-olive/15 text-olive border-olive/30',
    dot: 'bg-olive',
    solid: 'bg-olive text-white',
  },
  SERVED: {
    label: 'Served',
    blurb: 'Enjoy your food! Thanks for visiting Ivan Food Court',
    icon: CheckCircle2,
    chip: 'bg-ink/10 text-ink border-ink/20',
    dot: 'bg-ink',
    solid: 'bg-ink text-cream',
  },
  CANCELLED: {
    label: 'Cancelled',
    blurb: 'This order was cancelled',
    icon: XCircle,
    chip: 'bg-berry/12 text-berry border-berry/25',
    dot: 'bg-berry',
    solid: 'bg-berry text-white',
  },
};

export function StatusPill({ status, size = 'md' }: { status: OrderStatus; size?: 'sm' | 'md' }) {
  const m = STATUS_META[status];
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-[0.1em] ${m.chip} ${
        size === 'sm' ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'
      }`}
    >
      <Icon size={size === 'sm' ? 11 : 13} />
      {m.label}
    </span>
  );
}
