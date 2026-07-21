import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tienePermiso } from '../permisos';
import {
  LayoutGrid,
  Bell,
  PlusCircle,
  Map,
  User,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/tablero', label: 'Tablero', icon: LayoutGrid },
  { path: '/alertas', label: 'Alertas', icon: Bell },
  { path: '/alertas/nueva', label: 'Nueva Alerta', icon: PlusCircle },
  { path: '/mapa', label: 'Mapa', icon: Map },
  { path: '/perfil', label: 'Mi Perfil', icon: User },
  { path: '/admin', label: 'Admin', icon: Settings, adminOnly: true },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <nav className="top-nav" aria-label="Barra principal">
        <button
          className="menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Cerrar menu' : 'Abrir menu'}
          aria-expanded={sidebarOpen}
        >
          <Menu size={20} color="white" />
        </button>
        <div className="top-nav-logo">
          <ShieldCheck size={20} color="white" aria-hidden="true" />
          <span className="top-nav-logo-text">CiudadAlerta</span>
        </div>
        <div className="top-nav-user">
          <span className="top-nav-name">{user.nombre}</span>
          <span className="top-nav-role">{user.rol}</span>
          <button className="top-nav-logout" onClick={logout} title="Salir" aria-label="Cerrar sesion">
            <LogOut size={14} />
          </button>
        </div>
      </nav>

      <div className="app-body">
        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Menu lateral">
          <div className="sidebar-user">
            <div className="sidebar-avatar" aria-hidden="true">{user.nombre.charAt(0).toUpperCase()}</div>
            <div className="sidebar-info">
              <span className="sidebar-name">{user.nombre}</span>
              <span className="sidebar-role">{user.rol}</span>
            </div>
          </div>
          <ul className="sidebar-nav">
            {NAV_ITEMS.filter(item => !item.adminOnly || tienePermiso(user.rol, 'usuarios:ver')).map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`sidebar-link ${location.pathname === item.path || (item.path !== '/tablero' && location.pathname.startsWith(item.path)) ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sidebar-link-icon">
                      <Icon size={18} />
                    </span>
                    <span className="sidebar-link-label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
            <li className="sidebar-divider"></li>
            <li>
              <Link to="/" className="sidebar-link text-error" onClick={logout}>
                <span className="sidebar-link-icon">
                  <LogOut size={18} />
                </span>
                <span className="sidebar-link-label">Cerrar sesion</span>
              </Link>
            </li>
          </ul>
        </aside>
        <main className="main-content" onClick={() => setSidebarOpen(false)}>
          <div className="main-inner"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
