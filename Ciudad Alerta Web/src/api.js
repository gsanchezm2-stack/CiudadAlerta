const API = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : '/api';

function clearAuth() {
  localStorage.removeItem('ciudadalerta_user');
  localStorage.removeItem('ciudadalerta_token');
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('ciudadalerta_token');
  const headers = { ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    clearAuth();
    window.location.href = '/login';
    throw new Error('Sesion expirada. Inicia sesion de nuevo.');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.mensaje || `Error ${res.status}`);
  }

  return res.json();
}

export function loginUser(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export function registrarUsuario(nombre, email, password) {
  return request('/auth/registro', {
    method: 'POST',
    body: JSON.stringify({ nombre, email, password })
  });
}

export function forgotPassword(email) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export function resetPassword(token, password) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password })
  });
}

export function getAlertas(params = {}) {
  const qs = new URLSearchParams();
  if (params.sector) qs.set('sector', params.sector);
  if (params.tipo) qs.set('tipo', params.tipo);
  if (params.estado) qs.set('estado', params.estado);
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', params.page);
  if (params.limit) qs.set('limit', params.limit);
  if (params.fechaDesde) qs.set('fechaDesde', params.fechaDesde);
  if (params.fechaHasta) qs.set('fechaHasta', params.fechaHasta);
  if (params.lat) qs.set('lat', params.lat);
  if (params.lng) qs.set('lng', params.lng);
  if (params.radio) qs.set('radio', params.radio);
  const query = qs.toString();
  return request(`/alertas${query ? '?' + query : ''}`);
}

export function getAlerta(id) {
  return request(`/alertas/${id}`);
}

export function crearAlerta(data) {
  if (data.adjuntos && data.adjuntos.length > 0) {
    const formData = new FormData();
    formData.append('titulo', data.titulo);
    formData.append('tipo', data.tipo);
    formData.append('descripcion', data.descripcion);
    formData.append('sector', data.sector);
    if (data.lat) formData.append('lat', data.lat);
    if (data.lng) formData.append('lng', data.lng);
    data.adjuntos.forEach(f => formData.append('adjuntos', f));
    return request('/alertas', { method: 'POST', body: formData });
  }
  return request('/alertas', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function cambiarEstadoAlerta(id, estado) {
  return request(`/alertas/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado })
  });
}

export function eliminarAlerta(id) {
  return request(`/alertas/${id}`, { method: 'DELETE' });
}

export function getStats() {
  return request('/alertas/stats');
}

export function getUsuarios() {
  return request('/usuarios');
}

export function cambiarRolUsuario(id, rol) {
  return request(`/usuarios/${id}/rol`, {
    method: 'PATCH',
    body: JSON.stringify({ rol })
  });
}

export function crearComentario(alertaId, texto) {
  return request(`/alertas/${alertaId}/comentarios`, {
    method: 'POST',
    body: JSON.stringify({ texto })
  });
}

export function eliminarComentario(id) {
  return request(`/comentarios/${id}`, { method: 'DELETE' });
}

export function exportarCSV() {
  const token = localStorage.getItem('ciudadalerta_token');
  return fetch(`${API}/alertas/export`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => {
    if (!res.ok) throw new Error('Error al exportar');
    return res.blob();
  });
}
