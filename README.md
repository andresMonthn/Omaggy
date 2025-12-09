# TM-021 

Repo inicial con los componentes comentados para revisar su funcionamiento.

## Características principales

modularizado para la implementacion de cualquier logica de negocio
flexible, aplicaciones estaticas a aplicaciones SAAS

## Tecnologías utilizadas

### Monorepo y paquetes
- Monorepo con estructura `packages/*` organizada por dominios y utilidades.
- Módulos reutilizables bajo el namespace `@kit/*` (por ejemplo: `@kit/shared`, `@kit/ui`, `@kit/auth`, `@kit/supabase`, `@kit/monitoring`, `@kit/otp`, `@kit/next`, `@kit/cms`, `@kit/billing`).

### Frontend
- `Next.js` (App Router y Server Components) para SSR/SSG y rutas híbridas.
- `React` para composición de UI y hooks.
- `Tailwind CSS` como sistema de estilos utilitario.
- Componentes `shadcn/ui` y librería `@kit/ui` para construir interfaces.
- `@tanstack/react-query` para fetching, caché y mutaciones de datos.
- Internacionalización con `packages/i18n` (cliente y servidor).

### Backend y datos
- `Supabase` como backend: PostgreSQL, Autenticación, Storage y RPC.
- Clientes de Supabase para `browser`, `server`, `middleware` y `admin` (service role).
- Tipado fuerte de la base de datos en `packages/supabase/src/database.types.ts`.

### Autenticación
- Flujos: email/contraseña, OTP (passwordless), OAuth y MFA.
- Hooks de autenticación y `auth change listener` para reaccionar a eventos.
- Captcha (Cloudflare Turnstile) integrado en flujos sensibles.

### Monitoreo y registros
- `Sentry` para captura de errores y trazas en cliente/servidor.
- `Baselime` para observabilidad.
- Logger con `Pino` y fallback a `console` vía `@kit/shared/logger`.
- Bus de eventos de aplicación (`packages/shared/src/events`).

### Pagos
- Integración con `Stripe` (gateway común).
- Soporte de otros proveedores como `Lemon Squeezy` según configuración.
- Sincronización de órdenes y suscripciones mediante funciones/tabla tipadas.

### Email y notificaciones
- Plantillas de correo y servicios de envío (mailers).
- Notificaciones in‑app y por email (canales y tipos tipados).

### Herramientas de desarrollo
- `TypeScript` para tipado estático.
- `ESLint` y `Prettier` para estilo y calidad de código.
- `Zod` para validación de esquemas y parámetros.

### Despliegue
- `Vercel` para hosting y edge.
- Variables de entorno para Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLIC_KEY/ANON_KEY`, `SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY`.

## Instalación y configuración

1. Clonar el repositorio
2. Instalar dependencias con `pnpm install`
3. Configurar variables de entorno
4. Ejecutar en modo desarrollo con `pnpm dev`


