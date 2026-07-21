import { useState, useEffect } from 'react';
import { getUsuarios, cambiarRolUsuario } from '../api';
import { useAuth } from '../context/AuthContext';
import { tienePermiso } from '../permisos';

const ROLES = ['ciudadano', 'autoridad', 'administrador'];

export default function AdminPanel() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err) {
      setError(err.message || 'No se pudo cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleRolChange = async (id, nuevoRol) => {
    try {
      await cambiarRolUsuario(id, nuevoRol);
      setUsuarios(prev => prev.map(u => u._id === id ? { ...u, rol: nuevoRol } : u));
    } catch (err) {
      alert(err.message || 'Error al cambiar rol');
    }
  };

  if (!tienePermiso(user.rol, 'usuarios:ver')) {
    return <p className="empty">No tienes acceso a esta seccion</p>;
  }

  return (
    <div>
      <h2 className="page-title">Panel de Administracion</h2>
      <p className="page-subtitle">Gestionar usuarios y roles</p>

      {loading ? (
        <p className="empty">Cargando usuarios...</p>
      ) : error ? (
        <div className="empty" role="alert">
          <p className="error-message">{error}</p>
          <button className="btn btn-primary btn-sm" onClick={cargar}>Reintentar</button>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u._id}>
                  <td className="admin-name">{u.nombre}</td>
                  <td className="admin-email">{u.email}</td>
                  <td>
                    {u._id === user.id ? (
                      <span className={`role-badge role-${u.rol}`}>{u.rol}</span>
                    ) : (
                      <select
                        className="input input-sm"
                        value={u.rol}
                        onChange={(e) => handleRolChange(u._id, e.target.value)}
                        aria-label={`Cambiar rol de ${u.nombre}`}
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="admin-date">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-ES') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
