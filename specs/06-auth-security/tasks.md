# 06-auth-security / tasks.md — Tareas de Autenticación y Seguridad

## Checklist de Tareas

- [x] **T-06-1**: Instalar dependencias `@supabase/ssr` y `@supabase/supabase-js`.
- [x] **T-06-2**: Implementar el cliente para el navegador en `lib/supabase/client.ts`.
- [x] **T-06-3**: Implementar el cliente para servidor en `lib/supabase/server.ts` con manejo de cookies asíncronas.
- [x] **T-06-4**: Implementar el cliente administrativo en `lib/supabase/admin.ts` utilizando `SUPABASE_SERVICE_ROLE_KEY`.
- [x] **T-06-5**: Crear `middleware.ts` en la raíz del proyecto para protección de `/dashboard/*` y `/api/agent/*`.
- [x] **T-06-6**: Implementar página de inicio de sesión en `app/login/page.tsx` con manejo de errores en español y estados de carga.
- [x] **T-06-7**: Configurar variables de entorno y documentarlas en `.env.local.example`.
- [ ] **T-06-8**: Probar redirección al intentar acceder a `/dashboard` sin sesión activa.
