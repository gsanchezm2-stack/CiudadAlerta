import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAlertas } from '../api';
import { useAuth } from '../context/AuthContext';
import { tienePermiso } from '../permisos';
import { TIPOS_ALERTA, ESTADOS_ALERTA, formatFecha } from '../utils';

export default function AlertasList() {
  const { user } = useAuth();
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroSector, setFiltroSector] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [paginacion, setPaginacion] = useState({ total: 0, paginas: 1 });

  const puedeEliminar = useMemo(() => tienePermiso(user.rol, 'alertas:eliminar'), [user.rol]);

  const cargar = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10 };
      if (filtroSector) params.sector = filtroSector;
      if (filtroTipo) params.tipo = filtroTipo;
      if (filtroEstado) params.estado = filtroEstado;
      if (busqueda) params.q = busqueda;
      const data = await getAlertas(params);
      setAlertas(data.alertas);
      setPaginacion(data.paginacion);
      setPagina(page);
    } catch (err) {
      setError(err.message || 'Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  }, [filtroSector, filtroTipo, filtroEstado, busqueda]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleFiltrar = useCallback(() => { cargar(1); }, [cargar]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') cargar(1);
  }, [cargar]);

  return (
    <div>
      <h2 className="page-title">Alertas</h2>

      <div className="filter-bar">
        <input className="input filter-input" placeholder="Buscar en titulo o descripcion..."
          value={busqueda} onChange={(e) => setBusqueda(e.target.value)} onKeyDown={handleKeyDown} />
        <input className="input filter-input" placeholder="Filtrar por sector"
          value={filtroSector} onChange={(e) => setFiltroSector(e.target.value)} onKeyDown={handleKeyDown} />
        <select className="input filter-input" value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)} aria-label="Filtrar por tipo">
          <option value="">Todos los tipos</option>
          {TIPOS_ALERTA.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input filter-input" value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          {ESTADOS_ALERTA.map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
        </select>
        <button className="btn btn-primary" onClick={handleFiltrar}>Filtrar</button>
        <Link to="/alertas/nueva" className="btn btn-accent">Nueva</Link>
      </div>

      {loading ? (
        <p className="empty">Cargando alertas...</p>
      ) : error ? (
        <div className="empty" role="alert">
          <p className="error-message">{error}</p>
          <button className="btn btn-primary btn-sm" onClick={() => cargar(pagina)}>Reintentar</button>
        </div>
      ) : alertas.length === 0 ? (
        <p className="empty">No hay alertas registradas</p>
      ) : (
        <>
          <div className="alertas-grid">
            {alertas.map((item) => (
              <AlertaCard key={item._id} item={item} puedeEliminar={puedeEliminar} onDeleted={() => cargar(pagina)} />
            ))}
          </div>

          {paginacion.paginas > 1 && (
            <div className="pagination">
              <button className="btn btn-sm btn-primary" disabled={pagina <= 1}
                onClick={() => cargar(pagina - 1)}>&larr; Anterior</button>
              <span className="pagination-info">Pagina {pagina} de {paginacion.paginas} ({paginacion.total} total)</span>
              <button className="btn btn-sm btn-primary" disabled={pagina >= paginacion.paginas}
                onClick={() => cargar(pagina + 1)}>Siguiente &rarr;</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const AlertaCard = function AlertaCard({ item, puedeEliminar, onDeleted }) {
  return (
    <div className={`alerta-card border-${item.estado || 'pendiente'}`}>
      <div className="alerta-card-header">
        <span className={`badge badge-${item.estado}`}>{item.estado?.replace('_', ' ') || 'pendiente'}</span>
        <span className="alerta-fecha">{formatFecha(item.fecha)}</span>
      </div>
      <div className="alerta-card-body">
        <span className={`tipo-badge tipo-${item.tipo?.toLowerCase()}`}>{item.tipo}</span>
        <h3 className="alerta-card-desc">{item.titulo || item.descripcion}</h3>
        {item.titulo && <p className="alerta-card-desc" style={{ fontSize: '0.85em', opacity: 0.7, marginTop: 4 }}>{item.descripcion}</p>}
        <p className="alerta-card-sector">{item.sector}</p>
        <p className="alerta-card-autor">Reportado por: {item.autor?.nombre || 'Anonimo'}</p>
      </div>
      <div className="alerta-card-footer">
        <Link to={`/alertas/${item._id}`} className="btn btn-sm btn-primary">Ver mas</Link>
        {puedeEliminar && (
          <EliminarBtn id={item._id} onDeleted={onDeleted} />
        )}
      </div>
    </div>
  );
};

function EliminarBtn({ id, onDeleted }) {
  const handleClick = useCallback(async () => {
    if (!window.confirm('Deseas eliminar esta alerta?')) return;
    try {
      const { eliminarAlerta } = await import('../api');
      await eliminarAlerta(id);
      onDeleted();
    } catch {
      alert('Error al eliminar la alerta');
    }
  }, [id, onDeleted]);

  return <button className="btn btn-sm btn-danger" onClick={handleClick}>Eliminar</button>;
}
