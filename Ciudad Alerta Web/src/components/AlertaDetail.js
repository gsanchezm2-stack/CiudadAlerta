import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAlerta, cambiarEstadoAlerta, eliminarAlerta, crearComentario, eliminarComentario } from '../api';
import { useAuth } from '../context/AuthContext';
import { tienePermiso } from '../permisos';
import { ESTADOS_ALERTA, formatFecha } from '../utils';

export default function AlertaDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  const esAutor = alerta?.autor?._id === user.id;
  const puedeCambiarEstado = tienePermiso(user.rol, 'alertas:cambiar_estado') || (tienePermiso(user.rol, 'alertas:cerrar_propia') && esAutor);
  const puedeEliminar = tienePermiso(user.rol, 'alertas:eliminar');

  const estadosDisponibles = tienePermiso(user.rol, 'alertas:cambiar_estado')
    ? ESTADOS_ALERTA
    : ['resuelto'];

  useEffect(() => {
    async function load() {
      try {
        const data = await getAlerta(id);
        setAlerta(data);
        setComentarios(data.comentarios || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleEstadoChange = useCallback(async (e) => {
    const nuevoEstado = e.target.value;
    try {
      const updated = await cambiarEstadoAlerta(id, nuevoEstado);
      setAlerta(prev => ({ ...prev, estado: updated.estado }));
    } catch (err) {
      alert(err.message);
    }
  }, [id]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Seguro que quieres eliminar esta alerta?')) return;
    try {
      await eliminarAlerta(id);
      navigate('/alertas', { replace: true });
    } catch (err) {
      alert(err.message);
    }
  }, [id, navigate]);

  const handleComentario = useCallback(async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;
    setEnviando(true);
    try {
      const c = await crearComentario(id, nuevoComentario);
      setComentarios(prev => [c, ...prev]);
      setNuevoComentario('');
    } catch (err) {
      alert(err.message);
    } finally {
      setEnviando(false);
    }
  }, [id, nuevoComentario]);

  const handleDeleteComentario = useCallback(async (cid) => {
    if (!window.confirm('Eliminar comentario?')) return;
    try {
      await eliminarComentario(cid);
      setComentarios(prev => prev.filter(c => c._id !== cid));
    } catch (err) {
      alert(err.message);
    }
  }, []);

  if (loading) return <p className="empty">Cargando...</p>;
  if (error) return <p className="empty text-error">{error}</p>;
  if (!alerta) return <p className="empty">Alerta no encontrada</p>;

  return (
    <div>
      <Link to="/alertas" className="back-link">&larr; Volver a alertas</Link>
      <div className="detail-card">
        <div className="detail-header">
          <span className={`badge badge-${alerta.estado}`}>{alerta.estado?.replace('_', ' ') || 'pendiente'}</span>
          <span className={`tipo-badge tipo-${alerta.tipo?.toLowerCase()}`}>{alerta.tipo}</span>
        </div>
        <h2 className="detail-title">{alerta.titulo || alerta.descripcion}</h2>
        {alerta.titulo && <p className="detail-description">{alerta.descripcion}</p>}
        <div className="detail-meta">
          <div className="detail-meta-item">
            <span className="detail-label">Sector</span>
            <span className="detail-value">{alerta.sector}</span>
          </div>
          <div className="detail-meta-item">
            <span className="detail-label">Fecha</span>
            <span className="detail-value">{formatFecha(alerta.fecha)}</span>
          </div>
          <div className="detail-meta-item">
            <span className="detail-label">Reportado por</span>
            <span className="detail-value">{alerta.autor?.nombre || 'Anonimo'}</span>
          </div>
          <div className="detail-meta-item">
            <span className="detail-label">ID</span>
            <span className="detail-value text-mono">{alerta._id}</span>
          </div>
        </div>

        {alerta.adjuntos && alerta.adjuntos.length > 0 && (
          <div className="detail-photos">
            <span className="detail-label">Fotos adjuntas</span>
            <div className="detail-photos-grid">
              {alerta.adjuntos.map((adj, i) => (
                <a key={i} href={adj.url} target="_blank" rel="noopener noreferrer" className="detail-photo-link">
                  <img src={adj.url} alt={adj.nombre} className="detail-photo" />
                </a>
              ))}
            </div>
          </div>
        )}

        {alerta.lat && alerta.lng && (
          <div className="detail-coords">
            <span className="detail-label">Ubicacion</span>
            <span className="detail-value text-mono">{alerta.lat.toFixed(6)}, {alerta.lng.toFixed(6)}</span>
          </div>
        )}

        {puedeCambiarEstado && (
          <div className="detail-actions">
            <label className="detail-action-label">Cambiar estado:</label>
            <select className="input" value={alerta.estado} onChange={handleEstadoChange} aria-label="Cambiar estado de la alerta">
              {estadosDisponibles.map(e => (
                <option key={e} value={e}>{e.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        )}

        {puedeEliminar && (
          <div className="detail-actions detail-actions-danger">
            <button className="btn btn-danger" onClick={handleDelete}>Eliminar esta alerta</button>
          </div>
        )}
      </div>

      <div className="comentarios-section">
        <h3 className="section-title">Comentarios ({comentarios.length})</h3>

        <form className="comentario-form" onSubmit={handleComentario}>
          <textarea className="input textarea" placeholder="Escribe un comentario..."
            value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)} rows="3" />
          <button className="btn btn-primary" type="submit" disabled={enviando || !nuevoComentario.trim()}>
            {enviando ? 'Enviando...' : 'Comentar'}
          </button>
        </form>

        <div className="comentarios-list">
          {comentarios.map(c => (
            <div key={c._id} className="comentario-card">
              <div className="comentario-header">
                <span className="comentario-autor">{c.autor?.nombre || 'Anonimo'}</span>
                <span className={`role-badge role-${c.autor?.rol || 'ciudadano'}`}>{c.autor?.rol}</span>
                <span className="comentario-fecha">{formatFecha(c.fecha)}</span>
              </div>
              <p className="comentario-texto">{c.texto}</p>
              {(c.autor?._id === user.id || tienePermiso(user.rol, 'comentarios:eliminar')) && (
                <button className="btn-link-danger" onClick={() => handleDeleteComentario(c._id)}>Eliminar</button>
              )}
            </div>
          ))}
          {comentarios.length === 0 && <p className="empty">No hay comentarios aun</p>}
        </div>
      </div>
    </div>
  );
}
