import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { getAlertas, getStats, exportarCSV } from '../api';
import { useAuth } from '../context/AuthContext';
import { tienePermiso } from '../permisos';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const COLORS = ['#F5A623', '#4361EE', '#27AE60'];
const TIPO_COLORS = ['#DC2626', '#F5A623', '#4361EE', '#27AE60', '#9333EA', '#3730A3', '#6B7280'];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recientes, setRecientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [s, alertasData] = await Promise.all([getStats(), getAlertas({ limit: '5' })]);
        setStats(s);
        setRecientes(alertasData.alertas || []);
      } catch (err) {
        setError(err.message || 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExport = async () => {
    try {
      const blob = await exportarCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ciudadalerta_reportes.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error al exportar');
    }
  };

  const estadoData = stats?.porEstado || {};
  const tipoData = stats?.porTipo || {};
  const total = stats?.total || recientes.length;

  const doughnutData = {
    labels: ['Pendientes', 'En Revision', 'Resueltos'],
    datasets: [{
      data: [estadoData['pendiente'] || 0, estadoData['en_revision'] || 0, estadoData['resuelto'] || 0],
      backgroundColor: COLORS,
      borderWidth: 0,
      borderRadius: 4,
      spacing: 2
    }]
  };

  const barData = {
    labels: Object.keys(tipoData),
    datasets: [{
      data: Object.values(tipoData),
      backgroundColor: TIPO_COLORS.slice(0, Object.keys(tipoData).length),
      borderRadius: 6,
      borderSkipped: false
    }]
  };

  const lineData = stats?.porMes ? {
    labels: stats.porMes.map(m => m.mes),
    datasets: [{
      label: 'Alertas',
      data: stats.porMes.map(m => m.count),
      borderColor: '#4361EE',
      backgroundColor: 'rgba(67,97,238,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#4361EE'
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Tablero</h2>
          <p className="page-subtitle">Bienvenido, {user.nombre}</p>
        </div>
        {tienePermiso(user.rol, 'alertas:ver') && (
          <button className="btn btn-primary" onClick={handleExport}>Exportar CSV</button>
        )}
      </div>

      {loading ? (
        <p className="empty">Cargando...</p>
      ) : error ? (
        <div className="empty" role="alert">
          <p className="error-message">{error}</p>
          <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card stat-total">
              <span className="stat-number">{total}</span>
              <span className="stat-label">Total Alertas</span>
            </div>
            <div className="stat-card stat-pending">
              <span className="stat-number">{estadoData['pendiente'] || 0}</span>
              <span className="stat-label">Pendientes</span>
            </div>
            <div className="stat-card stat-review">
              <span className="stat-number">{estadoData['en_revision'] || 0}</span>
              <span className="stat-label">En revision</span>
            </div>
            <div className="stat-card stat-resolved">
              <span className="stat-number">{estadoData['resuelto'] || 0}</span>
              <span className="stat-label">Resueltos</span>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-title">Por Estado</h3>
              <div className="chart-wrap">
                <Doughnut data={doughnutData} options={chartOptions} />
              </div>
            </div>
            <div className="chart-card">
              <h3 className="chart-title">Por Tipo</h3>
              <div className="chart-wrap">
                <Bar data={barData} options={chartOptions} />
              </div>
            </div>
            {lineData && (
              <div className="chart-card chart-card-wide">
                <h3 className="chart-title">Tendencia Mensual</h3>
                <div className="chart-wrap">
                  <Line data={lineData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
                </div>
              </div>
            )}
          </div>

          <div className="section-title">Alertas recientes</div>
          <div className="recent-list">
            {recientes.map(a => (
              <Link to={`/alertas/${a._id}`} key={a._id} className="recent-card">
                <div className="recent-card-left">
                  <span className={`badge badge-${a.estado}`}>{a.estado?.replace('_', ' ') || 'pendiente'}</span>
                  <span className="recent-tipo">{a.tipo}</span>
                </div>
                <p className="recent-desc">{a.descripcion?.slice(0, 60)}...</p>
              </Link>
            ))}
            {recientes.length === 0 && <p className="empty">No hay alertas recientes</p>}
          </div>
        </>
      )}
    </div>
  );
}
