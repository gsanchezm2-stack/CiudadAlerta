const PERMISOS = {
  ciudadano: [
    'alertas:crear',
    'alertas:ver',
    'alertas:ver_stats',
    'alertas:cerrar_propia',
    'comentarios:crear',
    'comentarios:ver',
    'comentarios:eliminar_propio'
  ],
  autoridad: [
    'alertas:crear',
    'alertas:ver',
    'alertas:ver_stats',
    'alertas:cambiar_estado',
    'alertas:eliminar',
    'comentarios:crear',
    'comentarios:ver',
    'comentarios:eliminar_propio',
    'comentarios:eliminar'
  ],
  administrador: [
    'alertas:crear',
    'alertas:ver',
    'alertas:ver_stats',
    'alertas:cambiar_estado',
    'alertas:eliminar',
    'usuarios:ver',
    'usuarios:editar_rol',
    'comentarios:crear',
    'comentarios:ver',
    'comentarios:eliminar_propio',
    'comentarios:eliminar'
  ]
};

export function tienePermiso(rol, permiso) {
  return PERMISOS[rol]?.includes(permiso) ?? false;
}

export function tieneAlgunPermiso(rol, ...permisos) {
  return permisos.some(p => tienePermiso(rol, p));
}
