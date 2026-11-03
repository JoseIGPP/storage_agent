# 06-auth-security / spec.md — Especificación de Autenticación y Seguridad

## 1. Modelo de Acceso y Autorización
- **Rol Único**: El sistema es de uso privado exclusivo para el dueño o administrador de la tienda de conveniencia.
- **Acceso Protegido**: No existe auto-registro público (`/register` deshabilitado). La cuenta del dueño se aprovisiona desde la consola de administración de Supabase.
- **Mecanismo de Autenticación**: Inicio de sesión mediante Correo Electrónico y Contraseña.

## 2. Requisitos de Seguridad

### 2.1 Protección de Rutas (Guards)
- Cualquier intento de acceso a `/dashboard` o sub-rutas sin una sesión válida debe redirigir inmediatamente a `/login`.
- Si un usuario con sesión activa navega a `/login`, debe ser redirigido automáticamente a `/dashboard`.
- Todas las rutas de API bajo `/api/*` (incluyendo `/api/agent`) deben validar la sesión del usuario antes de ejecutar lógica de negocio.

### 2.2 Gestión de Credenciales y Claves Secretas
- `SUPABASE_SERVICE_ROLE_KEY` y `OPENAI_API_KEY` son claves confidenciales de servidor: **NUNCA** deben enviarse al navegador ni incluirse en el bundle del cliente.
- El cliente del navegador solo debe tener visibilidad de variables con prefijo `NEXT_PUBLIC_` (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### 2.3 Seguridad en Base de Datos (Row Level Security)
- Todas las tablas en PostgreSQL deben tener RLS activo.
- El usuario autenticado en el frontend opera bajo el rol `authenticated` con políticas de lectura y escritura controladas.
- El agente y las operaciones internas de agregación de reportes operan bajo el cliente de servicio `supabaseAdmin` en el servidor, bypassando RLS de forma segura.
