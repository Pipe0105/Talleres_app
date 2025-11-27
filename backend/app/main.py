try:
    from fastapi import FastAPI
except ModuleNotFoundError as exc:  # pragma: no cover - defensive guard for local setup issues
    raise ModuleNotFoundError(
        "FastAPI is required to run the backend. Install the Python dependencies with "
        "`python -m pip install -r backend/requirements.txt` and retry."
    ) from exc
import logging
from textwrap import dedent

from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from . import crud
from .config import (
    ADMIN_EMAIL,
    ADMIN_FULL_NAME,
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    API_PREFIX,
    DEFAULT_USER_EMAIL,
    DEFAULT_USER_FULL_NAME,
    DEFAULT_USER_PASSWORD,
    DEFAULT_USER_USERNAME,
    FRONTEND_ORIGINS,
)
from .database import Base, SessionLocal, engine
from .routers import auth, upload, items, cortes, talleres, users
from .security import get_password_hash

logger = logging.getLogger(__name__)


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

def _ensure_default_admin() -> None:
    """Create the default admin user if configuration variables are provided."""

    if not ADMIN_USERNAME or not ADMIN_PASSWORD:
        return

    with SessionLocal() as db:
        existing_admin = crud.get_user_by_username(db, ADMIN_USERNAME)
        if existing_admin:
            return

        try:
            hashed_password = get_password_hash(ADMIN_PASSWORD)
            crud.create_user(
                db,
                username=ADMIN_USERNAME,
                email=ADMIN_EMAIL,
                hashed_password=hashed_password,
                full_name=ADMIN_FULL_NAME,
                is_admin=True,
            )
            db.commit()
            logger.info("Default admin user created: %s", ADMIN_USERNAME)
        except SQLAlchemyError:
            db.rollback()
            logger.exception("Failed to create default admin user.")
            raise

def _ensure_default_operator() -> None:
    if not DEFAULT_USER_USERNAME or not DEFAULT_USER_PASSWORD:
        return
    
    with SessionLocal() as db:
        existing_user = crud.get_user_by_username(db, DEFAULT_USER_USERNAME)
        if existing_user:
            return
        
        try:
            hashed_password = get_password_hash(DEFAULT_USER_PASSWORD)
            crud.create_user(
                db,
                username=DEFAULT_USER_USERNAME,
                email=DEFAULT_USER_EMAIL,
                hashed_password=hashed_password,
                full_name=DEFAULT_USER_FULL_NAME,
                is_admin=False,
            )
            db.commit()
            logger.info("Default operator user created: %s", DEFAULT_USER_USERNAME)
        except SQLAlchemyError:
            db.rollback()
            logger.exception("Fallo creando usuario")
            raise
            


@app.on_event("startup")
def _startup():
    # Crear tablas
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        conn.execute(
            text(
                "ALTER TABLE IF EXISTS users "
                "ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE"
            )
        )
        conn.execute(
            text(
                "ALTER TABLE IF EXISTS users "
                "ADD COLUMN IF NOT EXISTS username TEXT"
            )
        )
        conn.execute(
            text("ALTER TABLE IF EXISTS users ALTER COLUMN email DROP NOT NULL")
        )
        conn.execute(text("UPDATE users SET username = email WHERE username IS NULL"))
        conn.execute(
            text("ALTER TABLE IF EXISTS users ALTER COLUMN username SET NOT NULL")
        )
        conn.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users(username)"
            )
        )
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
    JOIN items i ON i.id = td.item_id;
    """
    )
    with engine.begin() as conn:
        conn.execute(text(create_view_sql))
        
    _ensure_default_operator()


# Routers
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(upload.router, prefix=API_PREFIX)
app.include_router(items.router, prefix=API_PREFIX)
app.include_router(cortes.router, prefix=API_PREFIX)
app.include_router(talleres.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
