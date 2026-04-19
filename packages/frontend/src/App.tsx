import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { initSyncEngine } from './offline/syncEngine';
import { useAuthStore } from './store/useAuthStore';

const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/RegisterPage'));
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
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) return;
    const cleanup = initSyncEngine();
    return cleanup;
  }, [isAuthenticated]);

  return (
    <BrowserRouter>
      <Toast />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/new"
            element={
              <ProtectedRoute>
                <NewOrderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <CustomersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <ProtectedRoute>
                <CustomerDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Only show nav when authenticated */}
      {isAuthenticated() && <BottomNav />}
    </BrowserRouter>
  );
}
