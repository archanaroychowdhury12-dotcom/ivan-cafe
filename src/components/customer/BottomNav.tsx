import { Link, useLocation } from 'react-router-dom';
import { Clock, ShoppingCart, User, UtensilsCrossed } from 'lucide-react';

interface BottomNavProps {
  tableCode: string;
  cartCount: number;
  activeOrdersCount?: number;
  activeTab?: 'menu' | 'cart' | 'orders' | 'more';
  onOrdersClick?: () => void;
  onMoreClick?: () => void;
}

export function BottomNav({
  tableCode,
  cartCount,
  activeOrdersCount = 0,
  activeTab = 'menu',
  onOrdersClick,
  onMoreClick,
}: BottomNavProps) {
  const location = useLocation();
  const isMenu = activeTab === 'menu' || location.pathname === '/menu';
  const isCart = activeTab === 'cart' || location.pathname === '/cart';

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md bg-[#FAF6F0]/95 backdrop-blur-md border-t border-[#E8DFD1] px-6 py-2 safe-bottom shadow-float">
      <div className="flex items-center justify-between">
        {/* 1. Menu Tab */}
        <Link
          to={`/menu?table=${tableCode}`}
          className={`flex flex-col items-center gap-1 transition-colors relative py-1 ${
            isMenu ? 'text-[#18392B]' : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          <UtensilsCrossed size={21} strokeWidth={isMenu ? 2.5 : 2} />
          <span className="text-[11px] font-bold tracking-tight">Menu</span>
          {isMenu && (
            <span className="absolute -bottom-1 h-0.5 w-8 rounded-full bg-[#18392B]" />
          )}
        </Link>

        {/* 2. Cart Tab */}
        <Link
          to={`/cart?table=${tableCode}`}
          className={`flex flex-col items-center gap-1 transition-colors relative py-1 ${
            isCart ? 'text-[#18392B]' : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          <div className="relative">
            <ShoppingCart size={21} strokeWidth={isCart ? 2.5 : 2} />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#E5A93C] px-1 text-[9.5px] font-black text-white shadow-xs">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold tracking-tight">Cart</span>
          {isCart && (
            <span className="absolute -bottom-1 h-0.5 w-8 rounded-full bg-[#18392B]" />
          )}
        </Link>

        {/* 3. Customer Orders Tab (No staff kitchen link!) */}
        <button
          type="button"
          onClick={onOrdersClick}
          className="flex flex-col items-center gap-1 transition-colors relative py-1 text-stone-500 hover:text-stone-800"
        >
          <div className="relative">
            <Clock size={22} strokeWidth={2} />
            {activeOrdersCount > 0 && (
              <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-emerald-600 px-1 text-[9.5px] font-bold text-white shadow">
                {activeOrdersCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold tracking-tight">Orders</span>
        </button>

        {/* 4. More Options Tab */}
        <button
          type="button"
          onClick={onMoreClick}
          className="flex flex-col items-center gap-1 transition-colors relative py-1 text-stone-500 hover:text-stone-800"
        >
          <User size={22} strokeWidth={2} />
          <span className="text-[11px] font-bold tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
}
