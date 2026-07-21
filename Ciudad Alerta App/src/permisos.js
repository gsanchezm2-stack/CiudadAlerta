export const PERMISOS = {
  ciudadano: [
    'alertas:crear',
    'alertas:ver',
    'alertas:ver_stats',
    'alertas:cerrar_propia'
  ],
  autoridad: [
    'alertas:crear',
    'alertas:ver',
    'alertas:ver_stats',
    'alertas:cambiar_estado',
    'alertas:eliminar'
  ],
  administrador: [
    'alertas:crear',
    'alertas:ver',
    'alertas:ver_stats',
    'alertas:cambiar_estado',
    'alertas:eliminar',
    'usuarios:ver',
    'usuarios:editar_rol'
  ]
};

export function tienePermiso(rol, permiso) {
  return PERMISOS[rol]?.includes(permiso) ?? false;
}
