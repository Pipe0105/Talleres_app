## Purpose

This file gives concise, actionable instructions so AI coding agents can be productive quickly in this repository.

## Big picture (what/why)

- Frontend-only repository area: `frontend/` contains the client-side code and a mock API (`frontend/mock/db.json`).
- The frontend code calls a local REST API at `http://localhost:8000` (see `frontend/src/api/talleresApi.ts`). There is no server implementation in this repo — the mock JSON acts as the API surface.

## Key files to read first

- `frontend/src/api/talleresApi.ts` — shows all client REST calls (axios instance with baseURL `http://localhost:8000`, endpoints `/talleres`, `/productos`, `/archivos` and a POST to `/talleres`). Use this as the canonical example for adding new API helpers.
- `frontend/mock/db.json` — the mock data and resource shapes (`productos`, `precios`, `talleres`, `archivos`). Treat this as the contract for the REST API.
- `frontend/package.json` — currently only lists `axios` as a dependency and has no scripts. Expect to add scripts when integrating a dev server or json-server.

## Service boundaries & data flow

- Client ↔ REST API (expected at `http://localhost:8000`). The mock DB is shaped for json-server. Example flows:
  - GET `/talleres` -> list of workshop records (`talleres`)
  - GET `/productos` -> product catalog (`productos`)
  - GET `/archivos?taller_id=<id>` -> files linked to a taller (note the query param)
  - POST `/talleres` -> create a taller (see `createTaller` in API file)

## Data shape highlights (from `db.json`)

- `talleres` objects: `{ id, producto_id, codigo, peso_inicial, peso_taller, rendimiento, observaciones, fecha, grupo, creado_por }`
- `productos` objects: `{ id, codigo, nombre, descripcion }`
- `precios` objects: `{ id, producto_id, fecha_vigencia_desde, precio_unitario, impuestos_incluidos }`
- `archivos` objects: `{ id, taller_id, ruta, fecha_subida, creado_por, comentarios }`

Conventions to follow: use `creado_por` for creator fields, ISO-like date strings, numeric `id` and foreign keys like `producto_id` / `taller_id`.

## Developer workflows (repo-specific)

- Run a local mock API (json-server is the intended tool given `db.json`):

  PowerShell example (install json-server first if needed):

  ```powershell
  npm i -g json-server
  json-server --watch frontend/mock/db.json --port 8000
  ```

  - After starting the mock server, the frontend's API helpers (`frontend/src/api/talleresApi.ts`) will work against `http://localhost:8000`.
  - Alternative: add a script to `frontend/package.json`: `"mock":"json-server --watch mock/db.json --port 8000"` and run `npm run mock` inside `frontend`.

- Note: `frontend/package.json` currently has no `start` or `dev` script. If a dev front-end framework (React, Vite, etc.) is later added, add scripts there and document them here.

## Project-specific patterns and gotchas

- All API helpers return `axios` responses via `.data` (e.g. `getTalleres = async () => (await api.get('/talleres')).data`). Call-sites expect plain JSON payloads.
- `archivos` are queried using a filter query (`?taller_id=<id>`). When adding server-side logic or changing the mock, preserve that query convention.
- The codebase currently lacks explicit error-handling wrappers for API calls — agents adding features should wrap calls in try/catch at the caller level and preserve the `.data` return shape.

## How to extend safely

- Adding REST endpoints: update `frontend/mock/db.json` with the resource and restart json-server.
- Editing API helpers: follow `talleresApi.ts` style — create an axios instance, use `baseURL` and return `.data`.
- Adding tests or build steps: add scripts to `frontend/package.json` and list them here. Keep mock server port at 8000 unless you update `talleresApi.ts`.

## Assumptions made (verify with the team)

- The mock API is intended to be run with `json-server` on port 8000 (inferred from `db.json` and `baseURL`). If the project uses a different mock runner, update `baseURL` or this doc.
- There is no frontend build tool present yet; if you add React/Vite/CRA, document `npm run dev` and other scripts here.

If any of the assumptions are incorrect or you'd like a different format, tell me which parts to adjust and I will iterate.
