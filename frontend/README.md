# Talleres App

Aplicación web para controlar la producción de talleres cárnicos, gestionar listas de precios y monitorear inventarios en múltiples sedes. El proyecto combina un backend FastAPI con PostgreSQL y un frontend en React + Vite basado en Material UI para ofrecer autenticación JWT, carga de precios, registro detallado de talleres y tableros de control operativos.

## Arquitectura

- **Backend**: FastAPI con SQLAlchemy y PostgreSQL. Contiene la lógica de negocio para autenticación, talleres, inventario, listas de precios, cargas de archivos y métricas de dashboard. La inicialización crea tablas y puede provisionar usuarios por defecto (admin, operador y operadores por sede) según variables de entorno. CORS permite orígenes configurables para el frontend. Código en `backend/app` con routers en `backend/app/routers`.
- **Frontend**: React 18 con Vite, Material UI y Axios. Maneja sesión con JWT, protege rutas según rol, y expone vistas para talleres, informes históricos, inventario, lista de precios, administración de usuarios y perfil. Código en `frontend/src`.
- **Comunicación**: REST bajo el prefijo configurable `API_PREFIX` (por defecto `/api`). Los tokens se envían en el header `Authorization: Bearer <token>`.

## Estructura del repositorio

```
/backend      # Backend FastAPI, modelos y routers
/frontend     # Frontend React + Vite
package.json  # Scripts raíz para trabajar con el frontend
```

## Características principales

- **Autenticación y usuarios**: Registro, login y refresh de tokens JWT (`/api/auth`). Administración completa de usuarios con control de roles admin/gerente y activación (`/api/users`).
- **Gestión de talleres**: Creación con cálculo automático de pérdidas y subcortes, historial con filtros (fecha, sede, especie, SKU), seguimiento por usuario y cálculo de valor estimado (`/api/talleres`).
- **Inventario consolidado**: Sumatoria por sede y especie a partir de talleres procesados (`/api/inventario`).
- **Lista de precios**: Consulta de ítems activos (`/api/items`) y carga masiva de listas de precios desde archivos (`/api/upload/precios`).
- **Dashboard operativo**: Métricas de talleres activos, completados, inventario bajo y usuarios activos con tendencias móviles de 7 días (`/api/dashboard/resumen`).

## Requisitos previos

- Python 3.11+
- Node.js 18+ y npm
- PostgreSQL 14+ (local o remoto)
- Acceso a `bash`/`sh` y `make` opcionalmente para automatizar tareas.

## Configuración del backend

1. Crear y activar entorno virtual:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```
2. Instalar dependencias:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Crear un archivo `.env` en la raíz (o exportar variables) con, al menos:
   ```env
   API_PREFIX=/api
   DB_DRIVER=postgresql+psycopg2
   DB_USER=talleres_user
   DB_PASSWORD=talleres
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=talleres
   FRONTEND_ORIGINS=http://localhost:5173
   JWT_SECRET_KEY=cambia-esta-clave
   JWT_ALGORITHM=HS256
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=administrador
   ADMIN_EMAIL=admin@example.com
   ADMIN_FULL_NAME=Administrador
   DEFAULT_USER_USERNAME=operador
   DEFAULT_USER_PASSWORD=operador
   DEFAULT_USER_FULL_NAME=Operador Base
   ```

- **Creación automática de usuarios**: Al iniciar el backend se crean/actualizan el admin por defecto y los operadores definidos. También se generan operadores por sede usando la lista `BRANCH_LOCATIONS` de `backend/app/constants.py`.
- **Base de datos**: El backend usa SQLAlchemy; se crean tablas y migraciones iniciales en el arranque (`Base.metadata.create_all` y `apply_startup_migrations`). Puedes iniciar PostgreSQL rápidamente con Docker:
  ```bash
  docker run -d --name talleres-db -e POSTGRES_USER=talleres_user \
    -e POSTGRES_PASSWORD=talleres -e POSTGRES_DB=talleres -p 5432:5432 postgres:16
  ```

### Ejecutar el backend

```bash
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

La documentación interactiva de la API queda disponible en `http://localhost:8000/docs`.

## Configuración del frontend

1. Instalar dependencias (desde la raíz o dentro de `frontend`):
   ```bash
   cd frontend
   npm install
   ```
2. Crear `frontend/.env` con la URL del backend:
   ```env
   VITE_API_URL=http://localhost:8000/api
   # Alternativamente:
   # VITE_BACKEND_ORIGIN=http://localhost:8000
   ```
   El cliente normaliza el sufijo `/api` automáticamente si no se incluye.

### Ejecutar el frontend

```bash
npm run dev -- --host --port 5173
```

La aplicación quedará disponible en `http://localhost:5173`. Todas las rutas protegidas redirigen a `/login` si no hay sesión.

## Flujos de uso recomendados

1. **Iniciar sesión** con un usuario admin para habilitar navegación completa y vistas protegidas (ej. historial e informes).
2. **Cargar lista de precios** vía `/api/upload/precios` (vista de lista de precios en el frontend) para poblar el catálogo de ítems.
3. **Registrar talleres** desde la vista “Talleres” o “Talleres+”, seleccionando especie, sede, material principal y subcortes con pesos; el backend calcula pérdidas y porcentajes automáticamente.
4. **Monitorear operaciones**:
   - Seguimiento por usuario/fecha en `/talleres/seguimiento`.
   - Inventario consolidado por sede en `/inventario`.
   - Métricas y tendencias en el dashboard (`/api/dashboard/resumen`).
5. **Administrar usuarios** en `/usuarios`, incluyendo activación, roles admin/gerente y sede asignada.

## Calidad y mantenimiento

- Linter frontend: `npm run lint`
- Formateo frontend: `npm run format`
- El backend no incluye un runner de tests integrado, pero puedes usar `pytest` o `python -m unittest` agregando suites en el futuro.

## Despliegue

- Configura `FRONTEND_ORIGINS` con los dominios permitidos para CORS.
- Usa un `JWT_SECRET_KEY` robusto y aumenta `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` según la política de sesión deseada.
- Ejecuta Uvicorn detrás de un servidor de aplicaciones (por ejemplo, Gunicorn con `uvicorn.workers.UvicornWorker`) y sirve el frontend con un CDN o un servidor web estático.
