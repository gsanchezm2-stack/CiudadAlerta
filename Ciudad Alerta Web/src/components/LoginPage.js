import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, forgotPassword, resetPassword } from '../api';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(0);
  const [resetMsg, setResetMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      login(data.usuario, data.token);
      navigate('/tablero', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setResetMsg('');
    setLoading(true);
    try {
      const data = await forgotPassword(resetEmail);
      setResetToken(data.resetToken);
      setResetMsg('Token de recuperacion recibido');
      setResetStep(1);
    } catch (err) {
      setResetMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetMsg('');
    setLoading(true);
    try {
      await resetPassword(resetToken, newPassword);
      setResetMsg('Contrasena actualizada. Ya puedes iniciar sesion.');
      setResetStep(2);
    } catch (err) {
      setResetMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showForgot) {
    return (
      <div className="auth-page">
        <div className="auth-header">
          <div className="auth-brand">
            <div className="auth-brand-icon"><ShieldCheck size={18} color="white" /></div>
            CiudadAlerta
          </div>
          <p className="auth-brand-sub">Recuperar contrasena</p>
        </div>
        <div className="auth-container">
          <div className="auth-box">
            <h2 className="auth-title">Recuperar Contrasena</h2>
            {resetMsg && <p className={resetStep === 2 ? 'auth-success' : 'auth-error'} role="alert">{resetMsg}</p>}

            {resetStep === 0 && (
              <form onSubmit={handleForgot}>
                <div className="form-group">
                  <label className="form-label" htmlFor="reset-email">Email</label>
                  <input className="input" id="reset-email" type="email" placeholder="tu@email.com" value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)} required autoFocus />
                </div>
                <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>
            )}

            {resetStep === 1 && (
              <form onSubmit={handleReset}>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-password">Nueva contrasena</label>
                  <input className="input" id="new-password" type="password" placeholder="Min. 8 caracteres" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} required minLength={8} autoFocus />
                </div>
                <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                  {loading ? 'Actualizando...' : 'Cambiar contrasena'}
                </button>
              </form>
            )}

            {resetStep === 2 && (
              <button className="btn btn-primary btn-block" onClick={() => { setShowForgot(false); setResetStep(0); }}>
                Volver al login
              </button>
            )}

            <p className="auth-toggle">
              <button type="button" className="auth-link" onClick={() => { setShowForgot(false); setResetStep(0); }}>Volver al login</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-header">
        <div className="auth-brand">
          <div className="auth-brand-icon"><ShieldCheck size={18} color="white" /></div>
          CiudadAlerta
        </div>
        <p className="auth-brand-sub">Plataforma de alertas ciudadanas</p>
      </div>
      <div className="auth-container">
        <div className="auth-box">
          <h2 className="auth-title">Iniciar Sesion</h2>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input className="input" id="login-email" type="email" placeholder="tu@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Contrasena</label>
              <input className="input" id="login-password" type="password" placeholder="Tu contrasena" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p className="auth-toggle">
            <button type="button" className="auth-link" onClick={() => setShowForgot(true)}>Olvidaste tu contrasena?</button>
          </p>
          <p className="auth-toggle">
            No tienes cuenta?{' '}
            <button type="button" className="auth-link" onClick={() => navigate('/registro')}>Registrate</button>
          </p>
        </div>
      </div>
    </div>
  );
}
