import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrarUsuario } from '../api';
import { ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registrarUsuario(nombre, email, password);
      alert('Registrado exitosamente. Ahora inicia sesion.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  };

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
          <h2 className="auth-title">Crear Cuenta</h2>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-nombre">Nombre completo</label>
              <input className="input" id="reg-nombre" type="text" placeholder="Nombre completo" value={nombre}
                onChange={(e) => setNombre(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email</label>
              <input className="input" id="reg-email" type="email" placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Contrasena</label>
              <input className="input" id="reg-password" type="password" placeholder="Min. 8 caracteres" value={password}
                onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>
          <p className="auth-toggle">
            Ya tienes cuenta?{' '}
            <button type="button" className="auth-link" onClick={() => navigate('/login')}>Inicia sesion</button>
          </p>
        </div>
      </div>
    </div>
  );
}
