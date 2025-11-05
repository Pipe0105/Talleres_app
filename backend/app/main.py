from fastapi import FastAPI
from sqlalchemy import text
from .config import API_PREFIX
from .database import Base, engine
from .routers import upload, items, cortes, talleres

app = FastAPI(title="MercaMorfosis Backend")

@app.on_event("startup")
def _startup():
    # Crear tablas
    Base.metadata.create_all(bind=engine)
    # Crear/asegurar vista v_taller_calculo (idempotente)
    create_view_sql = '''
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_views WHERE viewname = 'v_taller_calculo'
      ) THEN
        EXECUTE $$
        CREATE VIEW v_taller_calculo AS
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
        $$;
      END IF;
    END $$;
    '''
    with engine.begin() as conn:
        conn.execute(text(create_view_sql))

# Routers
app.include_router(upload.router, prefix=API_PREFIX)
app.include_router(items.router, prefix=API_PREFIX)
app.include_router(cortes.router, prefix=API_PREFIX)
app.include_router(talleres.router, prefix=API_PREFIX)
