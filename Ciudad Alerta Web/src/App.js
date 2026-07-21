import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

const AppLayout = lazy(() => import('./components/AppLayout'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const AlertasList = lazy(() => import('./components/AlertasList'));
const AlertaDetail = lazy(() => import('./components/AlertaDetail'));
const AlertaNew = lazy(() => import('./components/AlertaNew'));
const Perfil = lazy(() => import('./components/Perfil'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const MapaAlertas = lazy(() => import('./components/MapaAlertas'));

function ProtectedRoute({ children }) {
  const { isAuthenticated, ready } = useAuth();
  if (!ready) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, ready } = useAuth();
  if (!ready) return <LoadingFallback />;
  if (isAuthenticated) return <Navigate to="/tablero" replace />;
  return children;
}

function LoadingFallback() {
  return (
    <div className="loading-fallback">
      <div className="loading-spinner"></div>
      <p>Cargando...</p>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/registro" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="/tablero" replace />} />
                  <Route path="tablero" element={<Dashboard />} />
                  <Route path="alertas" element={<AlertasList />} />
                  <Route path="alertas/nueva" element={<AlertaNew />} />
                  <Route path="alertas/:id" element={<AlertaDetail />} />
                  <Route path="mapa" element={<MapaAlertas />} />
                  <Route path="perfil" element={<Perfil />} />
                  <Route path="admin" element={<AdminPanel />} />
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
