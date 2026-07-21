import { useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { crearAlerta } from '../api';
import { TIPOS_ALERTA } from '../utils';

export default function AlertaNew() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [tipo, setTipo] = useState('');
  const [titulo, setTitulo] = useState('');
  const [sector, setSector] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivos, setArchivos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const handleFiles = useCallback((e) => {
    const nuevos = Array.from(e.target.files).slice(0, 3 - archivos.length);
    setArchivos(prev => [...prev, ...nuevos]);
    nuevos.forEach(f => {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews(prev => [...prev, reader.result]);
      reader.readAsDataURL(f);
    });
  }, [archivos.length]);

  const removeFile = useCallback((idx) => {
    setArchivos(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (!tipo || !titulo.trim() || !descripcion.trim() || !sector.trim()) {
      setError('Todos los campos son obligatorios');
      return;
    }
    if (titulo.trim().length < 5) {
      setError('El titulo debe tener al menos 5 caracteres');
      return;
    }
    if (descripcion.trim().length < 10) {
      setError('La descripcion debe tener al menos 10 caracteres');
      return;
    }

    setLoading(true);
    try {
      await crearAlerta({ titulo, tipo, descripcion, sector, adjuntos: archivos });
      setExito(true);
      setTimeout(() => navigate('/alertas', { replace: true }), 2000);
    } catch (err) {
      setError(err.message || 'No se pudo enviar la alerta');
    } finally {
      setLoading(false);
    }
  }, [tipo, titulo, descripcion, sector, archivos, navigate]);

  if (exito) {
    return (
      <div className="success-overlay" role="alert">
        <div className="success-modal">
          <div className="success-icon" aria-hidden="true">&#10003;</div>
          <h3 className="success-title">Reporte Enviado</h3>
          <p className="success-text">Tu alerta ha sido registrada exitosamente.</p>
          <div className="success-spinner" aria-hidden="true"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link to="/alertas" className="back-link">&larr; Volver a alertas</Link>
      <h2 className="page-title">Nueva Alerta</h2>

      {error && <p className="form-error" role="alert">{error}</p>}

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="new-titulo">Titulo</label>
          <input className="input" id="new-titulo" placeholder="Ej: Bache en avenida principal"
            value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={100} required />
          <span className="form-hint">{titulo.length}/100 caracteres</span>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="new-tipo">Tipo de alerta</label>
          <select className="input" id="new-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} required>
            <option value="">Selecciona un tipo...</option>
            {TIPOS_ALERTA.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="new-sector">Sector</label>
          <input className="input" id="new-sector" placeholder="Ej: Centro, Norte, Bella Vista..."
            value={sector} onChange={(e) => setSector(e.target.value)} required />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="new-descripcion">Descripcion detallada</label>
          <textarea className="input textarea" id="new-descripcion" placeholder="Describe el problema con detalle (min. 10 caracteres)"
            value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows="5" required />
          <span className="form-hint">{descripcion.length}/500 caracteres</span>
        </div>

        <div className="form-group">
          <label className="form-label">Fotos (max. 3)</label>
          <div
            className="upload-area"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
            role="button"
            tabIndex={0}
            aria-label="Adjuntar imagenes"
          >
            <input ref={fileInputRef} type="file" accept="image/*" multiple
              onChange={handleFiles} style={{ display: 'none' }} aria-hidden="true" />
            {archivos.length === 0 ? (
              <p className="upload-placeholder">Click para adjuntar imagenes</p>
            ) : (
              <div className="upload-previews">
                {previews.map((p, i) => (
                  <div key={i} className="upload-preview">
                    <img src={p} alt={`Adjunto ${i + 1}`} />
                    <button type="button" className="upload-remove" aria-label={`Eliminar imagen ${i + 1}`}
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}>&times;</button>
                  </div>
                ))}
                {archivos.length < 3 && (
                  <button type="button" className="upload-add" aria-label="Agregar otra imagen"
                    onClick={() => fileInputRef.current?.click()}>+</button>
                )}
              </div>
            )}
          </div>
          <span className="form-hint">{archivos.length}/3 archivos seleccionados</span>
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar Alerta'}
        </button>
      </form>
    </div>
  );
}
