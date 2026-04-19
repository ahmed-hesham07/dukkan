import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { initSyncEngine } from './offline/syncEngine';

const OrdersPage = lazy(() => import('./features/orders/OrdersPage'));
const NewOrderPage = lazy(() => import('./features/orders/NewOrderPage'));
const OrderDetailPage = lazy(() => import('./features/orders/OrderDetailPage'));
const InventoryPage = lazy(() => import('./features/inventory/InventoryPage'));
const CustomersPage = lazy(() => import('./features/customers/CustomersPage'));
const CustomerDetailPage = lazy(() => import('./features/customers/CustomerDetailPage'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <div className="text-4xl font-bold text-primary mb-2">دكان</div>
        <div className="text-gray-400 text-sm">جارٍ التحميل...</div>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const cleanup = initSyncEngine();
    return cleanup;
  }, []);

  return (
    <BrowserRouter>
      <Toast />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<OrdersPage />} />
          <Route path="/orders/new" element={<NewOrderPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
      <BottomNav />
    </BrowserRouter>
  );
}
