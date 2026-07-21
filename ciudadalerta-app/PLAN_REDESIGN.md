# Plan de Rediseño CiudadAlerta - Desde Cero

## Estructura Objetivo

```
ciudadalerta-app/
├── App.js                          # Root: providers + NavigationContainer
├── app.json                        # Expo config (actualizado)
├── index.js                        # Entry point (sin cambios)
├── package.json                    # Dependencias actualizadas
├── assets/                         # Iconos y splash
├── src/
│   ├── config.js                   # API_URL (sin cambios)
│   ├── api.js                      # API client (limpio, sin dead code)
│   ├── utils.js                    # Constantes unificadas
│   ├── permisos.js                 # Permisos (limpio)
│   ├── theme.js                    # ★ NUEVO: Design tokens (colores, tipografía, espaciado, radii)
│   ├── context/
│   │   ├── AuthContext.js          # Auth (mejorado con splash loading)
│   │   └── ThemeContext.js         # Theme (sin cambios significativos)
│   ├── navigation/
│   │   ├── AuthNavigator.js        # ★ NUEVO: Login/Register stack
│   │   ├── MainNavigator.js        # ★ NUEVO: Bottom tabs
│   │   └── AlertNavigator.js       # ★ NUEVO: Alert detail stack
│   ├── components/
│   │   ├── ui/                     # ★ NUEVO: Design system reutilizable
│   │   │   ├── NeuCard.js          # Card neumórfica
│   │   │   ├── NeuButton.js        # Botón con presets (primary/danger/accent/ghost)
│   │   │   ├── NeuInput.js         # Input neumórfico con label + error
│   │   │   ├── NeuBadge.js         # Badge para estados/tipos/roles
│   │   │   ├── NeuToggle.js        # Toggle neumórfico
│   │   │   ├── ScreenHeader.js     # Header de pantalla con título + subtítulo
│   │   │   ├── EmptyState.js       # Loading/error/empty states
│   │   │   └── Avatar.js           # Avatar con inicial
│   │   ├── auth/
│   │   │   ├── LoginScreen.js      # Login (renamed from LoginView)
│   │   │   └── RegisterScreen.js   # Register (renamed from RegisterView)
│   │   ├── screens/
│   │   │   ├── DashboardScreen.js  # Dashboard
│   │   │   ├── AlertasScreen.js    # Lista de alertas
│   │   │   ├── NuevaAlertaScreen.js # Formulario nueva alerta
│   │   │   ├── AlertaDetailScreen.js # Detalle de alerta
│   │   │   ├── PerfilScreen.js     # Perfil de usuario
│   │   │   └── AdminScreen.js      # Panel admin
│   │   └── ErrorBoundary.js        # Error boundary global
```

## Archivos a ELIMINAR (al final, después de validar)

| Archivo | Razón |
|---------|-------|
| `src/components/LoginView.js` | Reemplazado por `auth/LoginScreen.js` |
| `src/components/RegisterView.js` | Reemplazado por `auth/RegisterScreen.js` |
| `src/components/Dashboard.js` | Reemplazado por `screens/DashboardScreen.js` |
| `src/components/AlertaList.js` | Reemplazado por `screens/AlertasScreen.js` |
| `src/components/AlertaForm.js` | Reemplazado por `screens/NuevaAlertaScreen.js` |
| `src/components/AlertaDetail.js` | Reemplazado por `screens/AlertaDetailScreen.js` |
| `src/components/AdminPanel.js` | Reemplazado por `screens/AdminScreen.js` |
| `src/styles.js` | Reemplazado por `theme.js` + componentes `ui/` |

## Dependencias de api.js/utils.js/permisos.js (ANTES de cleanup)

Mapeo de qué importa qué, para no borrar nada vivo:

| Función/constante | Importada por | ¿Viva? |
|---|---|---|
| `api.js` → `restaurarAlerta` | Nada (no se usa en ningún componente) | **MUERTA** |
| `api.js` → `getHealth` | Nada | **MUERTA** |
| `api.js` → `getComentarios` | `AlertaDetail.js` viejo (usa comentarios inline) | **MUERTA** después de migrar AlertaDetail |
| `utils.js` → `ESTADOS_ALERTA` | Nada (badges hardcodeados en estilos) | **MUERTA** |
| `utils.js` → `TIPOS_ALERTA` | `AlertaForm.js` viejo | **VIVA** → reemplazable en NuevaAlertaScreen |
| `utils.js` → `formatFecha` | `AlertaList.js`, `AlertaDetail.js`, `Dashboard.js` | **VIVA** → migrar a nuevos screens |
| `permisos.js` → `tieneAlgunPermiso` | Nada | **MUERTA** |
| `permisos.js` → `tienePermiso` | `App.js` (admin tab) | **VIVA** → migrar a MainNavigator |

**Regla**: No tocar `api.js`/`utils.js`/`permisos.js` hasta que TODOS los screens viejos estén migrados y eliminados.

---

## FASE 0: Preparación Git

```bash
cd "C:\Users\gabri\Documents\Programadores En Proceso\ciudadalerta-app"
git status          # Verificar que estamos en la carpeta correcta
git branch          # Verificar rama actual
git checkout -b feature/rediseno-total
```

**Validación**: `git branch` muestra `feature/rediseno-total`.

---

## FASE 1: Dependencias + Design System

### Paso 1.1: Instalar dependencias
```bash
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context react-native-gesture-handler
```

Versiones seguras para Expo SDK 54 (Expo CLI validará automáticamente):
- `@react-navigation/native`: `^7.1.33`
- `@react-navigation/bottom-tabs`: `^7.15.5`
- `@react-navigation/native-stack`: `^7.8.6`
- `react-native-screens`: `~4.16.0`
- `react-native-safe-area-context`: `~5.6.0`
- `react-native-gesture-handler`: `~2.28.0`

**NO instalar**: `react-native-reanimated`, `@expo/vector-icons` (ya incluido).

### Paso 1.2: Crear `src/theme.js`

Design tokens centralizados:

```js
export const COLORS = {
  light: {
    bg: '#E0E5EC',
    surface: '#E0E5EC',
    card: '#E0E5EC',
    primary: '#5B7CFA',
    primaryLight: '#8B9FFA',
    primaryDark: '#3D5BD9',
    danger: '#dc2626',
    warning: '#d97706',
    success: '#16a34a',
    text: '#2d4059',
    textSecondary: '#7a8ba8',
    textMuted: '#a0b0c8',
    border: 'rgba(0,0,0,0.05)',
    shadowLight: '#FFFFFF',
    shadowDark: '#A3B1C6',
  },
  dark: {
    bg: '#1a1a2e',
    surface: '#16213e',
    card: '#16213e',
    primary: '#5B7CFA',
    primaryLight: '#8B9FFA',
    primaryDark: '#3D5BD9',
    danger: '#ef4444',
    warning: '#f59e0b',
    success: '#22c55e',
    text: '#e2e8f0',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: 'rgba(255,255,255,0.06)',
    shadowLight: '#2a2d3a',
    shadowDark: '#0f1016',
  },
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const RADIUS = { sm: 6, md: 10, lg: 14, xl: 20, full: 100 };
export const FONT = {
  xs: 11, sm: 12, md: 14, lg: 15, xl: 16, xxl: 20, title: 24, hero: 26,
  weight: { normal: '400', medium: '500', semibold: '600', bold: '700', heavy: '800' },
};

// Neumorphic shadow helpers (Platform.select)
export const neu = {
  raised: (theme) => { /* ... */ },
  small: (theme) => { /* ... */ },
  inset: (theme) => { /* ... */ },
  insetSmall: (theme) => { /* ... */ },
};

// Hook para usar colores del tema
export function useColors() { /* ... */ }
```

### Paso 1.3: Crear componentes UI base

Solo los necesarios para la Fase 2 (auth screens):
- `src/components/ui/NeuCard.js`
- `src/components/ui/NeuButton.js`
- `src/components/ui/NeuInput.js`
- `src/components/ui/EmptyState.js`
- `src/components/ui/Avatar.js`

Los demás UI components se crean cuando se necesitan.

### ✅ Test Fase 1
- `npx expo start` compila sin errores
- `theme.js` exporta `COLORS`, `SPACING`, `RADIUS`, `FONT`, `neu`, `useColors`
- Los 5 componentes UI se importan sin errores

---

## FASE 2: Auth Flow (Login + Register) — Screens más simples primero

### Paso 2.1: Crear `src/navigation/AuthNavigator.js`
- Stack: LoginScreen → RegisterScreen
- Sin header propio

### Paso 2.2: Crear `src/components/auth/LoginScreen.js`
- NeuCard container, NeuInput×2 (email, password), NeuButton submit
- Link a register
- Usa `useAuth().login()`

### Paso 2.3: Crear `src/components/auth/RegisterScreen.js`
- NeuCard container, NeuInput×3 (nombre, email, password), NeuButton submit
- Link a login
- Usa `api.registrarUsuario()` + `useAuth().login()`

### Paso 2.4: Crear `src/components/ErrorBoundary.js`
- Class component con `componentDidCatch`
- Muestra error + botón retry

### Paso 2.5: Actualizar `App.js` (solo auth flow)
```jsx
<ThemeProvider>
  <AuthProvider>
    <ErrorBoundary>
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    </ErrorBoundary>
  </AuthProvider>
</ThemeProvider>
```

**NO tocar** los componentes viejos aún — App.js viejo se reemplaza completamente.

### ✅ Test Fase 2
- Login funcional: ingreso → token → navega a tabs
- Register funcional: registro → login automático
- Theme toggle funciona en auth screens
- Logout vuelve a login
- `git commit -m "feat: auth flow con design system neumórfico"`

---

## FASE 3: Bottom Tabs + Dashboard + Perfil — Screens simples

### Paso 3.1: Crear `src/navigation/MainNavigator.js`
- Bottom tabs: Dashboard, Alertas, + (Nueva), Perfil, Admin (condicional por `tienePermiso`)
- Iconos: Ionicons (`@expo/vector-icons` ya incluido)
- Tab bar neumórfica

### Paso 3.2: Crear `src/components/screens/DashboardScreen.js`
- Stats cards (NeuCard×3: total, pendientes, resueltas)
- Recent alerts list (últimas 5)
- Pull-to-refresh
- Usa `api.getStats()` y `api.getAlertas()`

### Paso 3.3: Crear `src/components/screens/PerfilScreen.js`
- Avatar con inicial
- Info rows (nombre, email, rol)
- Botón logout
- NeuCard container

### Paso 3.4: Actualizar `App.js` para usar MainNavigator
```jsx
// Cuando autenticado:
<MainNavigator />
```

### ✅ Test Fase 3
- Bottom tabs navegan correctamente
- Dashboard carga stats del backend
- Perfil muestra datos del usuario
- Theme toggle persiste entre tabs
- Admin tab aparece solo para admins
- Pull-to-refresh funciona
- `git commit -m "feat: main tabs + dashboard + perfil screens"`

---

## FASE 4: Alertas Flow — Screens complejas

### Paso 4.1: Crear `src/navigation/AlertNavigator.js`
- Stack anidado en tab Alertas: AlertasScreen → AlertaDetailScreen

### Paso 4.2: Crear `src/components/ui/NeuBadge.js`
- Badge con presets: estado (pendiente/en_revision/resuelto), tipo (seguridad/infra/etc), rol
- Colores derivados del theme

### Paso 4.3: Crear `src/components/screens/AlertasScreen.js`
- FlatList con NeuCard items
- Filter bar (tipo, estado)
- Search input
- Tap → AlertaDetailScreen
- `onEndReached` para paginación

### Paso 4.4: Crear `src/components/screens/NuevaAlertaScreen.js`
- Tipo chips (selección)
- NeuInput×3 (descripción, sector, opcionalmente más)
- NeuButton submit
- KeyboardAvoidingView
- Después de crear → vuelve a AlertasScreen

### Paso 4.5: Crear `src/components/screens/AlertaDetailScreen.js`
- Full detail card
- Status change (solo autoridad/admin)
- Comments section
- Delete button (solo autoridad/admin)
- Back button (via navigation)

### ✅ Test Fase 4
- Lista de alertas carga del backend
- Filtros funcionan
- Crear alerta funciona
- Ver detalle funciona
- Cambiar estado funciona (con permisos)
- Comentarios se ven y se crean
- Eliminar alerta funciona (con permisos)
- Pull-to-refresh en lista
- `git commit -m "feat: alertas CRUD completo con neumorfismo"`

---

## FASE 5: Admin Screen

### Paso 5.1: Crear `src/components/ui/ScreenHeader.js`
- Header con título + subtítulo + botón derecho opcional

### Paso 5.2: Crear `src/components/screens/AdminScreen.js`
- User list (FlatList)
- Role change (picker o botones)
- Search filter
- NeuCard items

### ✅ Test Fase 5
- Admin carga lista de usuarios
- Cambiar rol funciona
- Búsqueda filtra usuarios
- Solo visible para admins
- `git commit -m "feat: admin panel con design system"`

---

## FASE 6: Limpieza (DESPUÉS de que todo funcione)

### Paso 6.1: Eliminar componentes viejos
```bash
rm src/components/LoginView.js
rm src/components/RegisterView.js
rm src/components/Dashboard.js
rm src/components/AlertaList.js
rm src/components/AlertaForm.js
rm src/components/AlertaDetail.js
rm src/components/AdminPanel.js
rm src/styles.js
```

### Paso 6.2: Limpiar api.js
- Eliminar `restaurarAlerta`, `getHealth`, `getComentarios`
- Solo eliminar después de confirmar que ningún screen nuevo los importa

### Paso 6.3: Limpiar utils.js
- Eliminar `ESTADOS_ALERTA` (badges ahora en NeuBadge)
- Mantener `TIPOS_ALERTA` y `formatFecha` (usan en nuevos screens)

### Paso 6.4: Limpiar permisos.js
- Eliminar `tieneAlgunPermiso`
- Mantener `tienePermiso` y `PERMISOS` (usan en MainNavigator)

### Paso 6.5: Actualizar app.json
- `userInterfaceStyle: "automatic"`
- `splash.backgroundColor: "#E0E5EC"`

### ✅ Test Fase 6
- App compila sin errores tras eliminar archivos
- Todos los screens funcionan igual
- No hay imports rotos
- `git commit -m "chore: eliminar código muerto y archivos viejos"`

---

## FASE 7: Backend (después del frontend completo)

- Eliminar `auth.js` y `usuario.js` root (dead code)
- Agregar `PATCH /api/auth/profile` (editar nombre/email)
- Agregar `POST /api/auth/change-password`
- Agregar paginación en `GET /api/usuarios`
- Agregar paginación en `GET /api/alertas/:id/comentarios`
- Agregar query `?mia=true` en `GET /api/alertas`
- Crear `scripts/seed.js` para usuario admin inicial

### ✅ Test Fase 7
- Editar perfil funciona desde la app
- Cambiar contraseña funciona
- Paginación de usuarios funciona
- Paginación de comentarios funciona
- Filtro "mis alertas" funciona
- `git commit -m "feat: backend improvements + profile + password change"`

---

## Resumen de Ejecución

| Fase | Archivos nuevos | Archivos eliminados | Test integrado |
|------|----------------|---------------------|----------------|
| 0 | 0 | 0 | git branch creado |
| 1 | 6 (theme + 5 UI) | 0 | Compila sin errores |
| 2 | 4 (nav + auth + error) | 0 | Login/Register funcionan |
| 3 | 3 (main nav + dashboard + perfil) | 0 | Tabs + dashboard + perfil |
| 4 | 4 (alert nav + 3 screens + badge) | 0 | CRUD alertas completo |
| 5 | 2 (screen header + admin) | 0 | Admin panel funcional |
| 6 | 0 | 8 | Todo funciona tras limpieza |
| 7 | 0 (backend) | 2 (backend) | Backend mejorado |
| **Total** | **~19 archivos nuevos** | **~10 archivos eliminados** | **Test en cada fase** |
