import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'auto', label: 'Automatico', icon: Monitor },
];

export default function Perfil() {
  const { user, logout } = useAuth();
  const { mode, setThemeMode } = useTheme();

  return (
    <div>
      <h2 className="page-title">Mi Perfil</h2>

      <div className="perfil-card">
        <div className="perfil-avatar-large" aria-hidden="true">{user.nombre?.charAt(0).toUpperCase()}</div>
        <div className="perfil-info">
          <div className="perfil-row">
            <span className="perfil-label">Nombre</span>
            <span className="perfil-value">{user.nombre}</span>
          </div>
          <div className="perfil-row">
            <span className="perfil-label">Email</span>
            <span className="perfil-value">{user.email}</span>
          </div>
          <div className="perfil-row">
            <span className="perfil-label">Rol</span>
            <span className="perfil-value">
              <span className={`role-badge role-${user.rol}`}>{user.rol}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="perfil-card">
        <h3 className="perfil-section-title">Apariencia</h3>
        <div className="theme-selector" role="radiogroup" aria-label="Seleccionar tema">
          {THEME_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => setThemeMode(opt.value)}
                className={`theme-option ${mode === opt.value ? 'theme-option-active' : ''}`}
                role="radio"
                aria-checked={mode === opt.value}
                aria-label={`Tema ${opt.label}`}
              >
                <Icon size={16} aria-hidden="true" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="perfil-actions">
        <button className="btn btn-danger" onClick={logout} aria-label="Cerrar sesion">Cerrar sesion</button>
      </div>
    </div>
  );
}
