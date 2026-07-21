export const TIPOS_ALERTA = ['Seguridad', 'Infraestructura', 'Movilidad', 'Ambiental', 'Salud', 'Educacion', 'Otro'];

export function formatFecha(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
