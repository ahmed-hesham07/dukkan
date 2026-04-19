import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { initSyncEngine } from './offline/syncEngine';
import { pullFromServer } from './offline/pullSync';
import { useAuthStore } from './store/useAuthStore';

const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/RegisterPage'));
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'));
const OrdersPage = lazy(() => import('./features/orders/OrdersPage'));
const NewOrderPage = lazy(() => import('./features/orders/NewOrderPage'));
const OrderDetailPage = lazy(() => import('./features/orders/OrderDetailPage'));
const ReturnPage = lazy(() => import('./features/orders/ReturnPage'));
const InventoryPage = lazy(() => import('./features/inventory/InventoryPage'));
const CustomersPage = lazy(() => import('./features/customers/CustomersPage'));
const CustomerDetailPage = lazy(() => import('./features/customers/CustomerDetailPage'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F4FF' }}>
      <div className="text-center">
        <div className="text-4xl font-black mb-2" style={{ color: '#7C3AED' }}>دكان</div>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto"
          style={{ borderColor: '#7C3AED', borderTopColor: 'transparent' }} />
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated() || !user?.tenantId) return;
    const cleanup = initSyncEngine();
    // Pull latest server data into IndexedDB whenever the app loads authenticated
    pullFromServer(user.tenantId);
    return cleanup;
  }, [isAuthenticated, user?.tenantId]);

  return (
    <BrowserRouter>
      <Toast />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Dashboard — home */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Orders */}
          <Route
            path="/orders"
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
            path="/orders/:id/return"
            element={
              <ProtectedRoute>
                <ReturnPage />
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

          {/* Inventory */}
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <InventoryPage />
              </ProtectedRoute>
            }
          />

          {/* Customers */}
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

          {/* Settings */}
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

      {isAuthenticated() && <BottomNav />}
    </BrowserRouter>
  );
}
