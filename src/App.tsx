import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastHost } from './components/ui';
import Landing from './pages/Landing';
import MenuPage from './pages/Menu';
import CartPage from './pages/Cart';
import OrderStatusPage from './pages/OrderStatus';
import KitchenPage from './pages/Kitchen';
import Admin from './pages/admin/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <ToastHost>
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/order/:code" element={<OrderStatusPage />} />
          <Route path="/kitchen" element={<KitchenPage />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/login" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastHost>
    </BrowserRouter>
  );
}
