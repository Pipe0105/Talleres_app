try:
    from fastapi import FastAPI
except ModuleNotFoundError as exc:  # pragma: no cover - defensive guard for local setup issues
    raise ModuleNotFoundError(
        "FastAPI is required to run the backend. Install the Python dependencies with "
        "`python -m pip install -r backend/requirements.txt` and retry."
    ) from exc
from textwrap import dedent

from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .config import API_PREFIX, FRONTEND_ORIGINS
from .database import Base, engine
from .routers import auth, upload, items, cortes, talleres

app = FastAPI(title="MercaMorfosis Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    """Simple root endpoint to verify that the API is running."""
    return {"status": "OK"}
    


@app.on_event("startup")
def _startup():
    # Crear tablas
    Base.metadata.create_all(bind=engine)
    # Crear/asegurar vista v_taller_calculo (idem potente)
    create_view_sql = dedent(
        """
    CREATE OR REPLACE VIEW v_taller_calculo AS
    SELECT
      td.taller_id,
      c.nombre_corte,
      i.item_code,
      i.descripcion,
      i.precio_venta,
      td.peso,
      SUM(td.peso) OVER (PARTITION BY td.taller_id) AS peso_total,
      c.porcentaje_default,
      CASE
        WHEN SUM(td.peso) OVER (PARTITION BY td.taller_id) > 0
        THEN td.peso / SUM(td.peso) OVER (PARTITION BY td.taller_id) * 100
        ELSE 0
      END AS porcentaje_real,
      (CASE
        WHEN SUM(td.peso) OVER (PARTITION BY td.taller_id) > 0
        THEN td.peso / SUM(td.peso) OVER (PARTITION BY td.taller_id) * 100
        ELSE 0
      END - c.porcentaje_default) AS delta_pct,
      td.peso * i.precio_venta AS valor_estimado
    FROM taller_detalles td
    JOIN cortes c ON c.id = td.corte_id
    JOIN talleres t ON t.id = td.taller_id
    JOIN items i ON i.id = t.item_id;
    """
    )
    with engine.begin() as conn:
        conn.execute(text(create_view_sql))

# Routers
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(upload.router, prefix=API_PREFIX)
app.include_router(items.router, prefix=API_PREFIX)
app.include_router(cortes.router, prefix=API_PREFIX)
app.include_router(talleres.router, prefix=API_PREFIX)
