# TM-021

Repo inicial con los componentes comentados para revisar su funcionamiento.

## Características principales

modularizado para la implementacion de cualquier logica de negocio
flexible, aplicaciones estaticas a aplicaciones SAAS

## Guía de Instalación y Ejecución

### 1. Backend: Ollama (Modelo Local)

Este proyecto requiere Ollama corriendo localmente para procesar las respuestas de la IA.

**Instalación:**
1. Descarga e instala Ollama desde [ollama.com](https://ollama.com).
2. Abre una terminal y descarga el modelo Llama 3 (versión 3.2 recomendada):
   ```bash
   ollama pull llama3.2
   ```

**Verificación:**
Asegúrate de que Ollama esté escuchando en el puerto 11434:
```bash
curl http://localhost:11434
# Debería responder: "Ollama is running"
```

### 2. Servicio Intermedio: AI Brain (Python)

Este microservicio actúa como cerebro, gestionando el contexto y conectando con Ollama.

**Ubicación:** Carpeta `ai-core-service/ai-brain` (o similar, ajusta según tu estructura).

**Requisitos:**
- Python 3.11+
- Virtualenv

**Pasos:**
1. Navega a la carpeta del servicio:
   ```bash
   cd ai-brain
   ```
2. Crea y activa el entorno virtual:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate   # Windows
   # source venv/bin/activate # Linux/Mac
   ```
3. Instala dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Levanta el servidor:
   ```bash
   python app/main.py
   ```
   *Debe iniciar en `http://127.0.0.1:8000`.*

### 3. Frontend: Web App (Next.js)

La aplicación principal que consume el servicio AI Brain.

**Pasos:**
1. Navega a la raíz del monorepo (`Omaggy`).
2. Instala dependencias:
   ```bash
   pnpm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   pnpm dev
   ```
4. Abre [http://localhost:3000/chatAI](http://localhost:3000/chatAI).

---

## Documentación Técnica: Microservicio LLM

### Configuración del Servicio
El microservicio (`api-brain`) expone la lógica de negocio para las entrevistas y el chat.

**Puerto:** `8000` (por defecto)
**URL Base:** `http://127.0.0.1:8000`

### Endpoints Expuestos

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/v1/interview/answer` | Endpoint principal para chat. Recibe preguntas y devuelve respuestas procesadas por la "persona" del entrevistador. |
| `GET` | `/docs` | Documentación Swagger UI automática (si está habilitada). |
| `GET` | `/openapi.json` | Especificación OpenAPI del servicio. |

**Ejemplo de Payload (/v1/interview/answer):**
```json
{
  "question": "¿Cómo funciona el Event Loop en Node.js?",
  "max_tokens": 500
}
```

### Variables de Entorno

**Frontend (`apps/web/.env.local`):**
No requiere variables específicas para el chat local, ya que el proxy está hardcodeado en el API Route por ahora.
- Proxy configurado en: `apps/web/app/api/chat/route.ts` apuntando a `http://127.0.0.1:8000/v1/interview/answer`.

**Backend (`ai-brain/.env`):**
(Ajusta según la configuración real de tu servicio Python)
- `OLLAMA_BASE_URL`: `http://localhost:11434`
- `MODEL_NAME`: `llama3.2`

---

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
