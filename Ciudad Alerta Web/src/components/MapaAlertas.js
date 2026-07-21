import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAlertas } from '../api';
import { formatFecha } from '../utils';

const markerColors = {
  Seguridad: '#DC2626',
  Infraestructura: '#F5A623',
  Movilidad: '#4361EE',
  Ambiental: '#27AE60',
  Salud: '#9333EA',
  Educacion: '#3730A3',
  Otro: '#6B7280'
};

function createIcon(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}

export default function MapaAlertas() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getAlertas({ limit: '100' });
        setAlertas(data.alertas || []);
      } catch (err) {
        setError(err.message || 'Error al cargar mapa');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const alertasFiltradas = useMemo(() => {
    if (!filtroTipo) return alertas;
    return alertas.filter(a => a.tipo === filtroTipo);
  }, [alertas, filtroTipo]);

  const alertasConCoords = useMemo(() => {
    return alertasFiltradas.filter(a => a.lat && a.lng);
  }, [alertasFiltradas]);

  const centro = useMemo(() => {
    if (alertasConCoords.length === 0) return [18.5, -69.9];
    const avgLat = alertasConCoords.reduce((s, a) => s + a.lat, 0) / alertasConCoords.length;
    const avgLng = alertasConCoords.reduce((s, a) => s + a.lng, 0) / alertasConCoords.length;
    return [avgLat, avgLng];
  }, [alertasConCoords]);

  if (loading) return <p className="empty">Cargando mapa...</p>;
  if (error) return (
    <div className="empty" role="alert">
      <p className="error-message">{error}</p>
      <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>Reintentar</button>
    </div>
  );

  return (
    <div>
      <h2 className="page-title">Mapa de Alertas</h2>

      <div className="filter-bar">
        <select className="input filter-input" value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)} aria-label="Filtrar por tipo">
          <option value="">Todos los tipos</option>
          {['Seguridad', 'Infraestructura', 'Movilidad', 'Ambiental', 'Salud', 'Educacion', 'Otro'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="pagination-info">{alertasConCoords.length} alertas con ubicacion</span>
      </div>

      <div className="map-container">
        <MapContainer center={centro} zoom={12} style={{ height: '100%', width: '100%', minHeight: '350px', borderRadius: '14px' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {alertasConCoords.map(a => (
            <Marker key={a._id} position={[a.lat, a.lng]} icon={createIcon(markerColors[a.tipo] || '#6b7280')}>
              <Popup>
                <div className="map-popup">
                  <strong>{a.titulo || a.tipo}</strong><br />
                  <span className="map-popup-date">{formatFecha(a.fecha)}</span>
                  <p className="map-popup-desc">{(a.descripcion || '').slice(0, 80)}{a.descripcion?.length > 80 ? '...' : ''}</p>
                  <p className="map-popup-sector">{a.sector}</p>
                  <Link to={`/alertas/${a._id}`} className="map-popup-link">
                    Ver detalle &rarr;
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {alertasConCoords.length === 0 && (
        <p className="empty">No hay alertas con ubicacion para mostrar</p>
      )}
    </div>
  );
}
