"""Helpers to apply database migrations during application startup.

These are lightweight guards meant to keep schema adjustments centralized
until a full migration tool (e.g. Alembic) is wired into the project.
"""
from __future__ import annotations
from sqlalchemy import Engine, text


def apply_startup_migrations(engine: Engine) -> None:
    """Run idempotent DDL statements expected by the application.

    This keeps ad-hoc schema changes in one place instead of scattered across
    the startup hook.
    """
    with engine.begin() as conn:
        conn.execute(
            text(
                "ALTER TABLE IF EXISTS users "
                "ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE"
            )
        )
        conn.execute(
            text("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS username TEXT")
        )
        conn.execute(
            text(
                "ALTER TABLE IF EXISTS users "
                "ADD COLUMN IF NOT EXISTS is_gerente BOOLEAN NOT NULL DEFAULT FALSE"
            )
        )
        conn.execute(
            text(
                "ALTER TABLE IF EXISTS users "
                "ADD COLUMN IF NOT EXISTS is_coordinator BOOLEAN NOT NULL DEFAULT FALSE"
            )
        )
        conn.execute(
            text(
                "ALTER TABLE IF EXISTS users "
                "ADD COLUMN IF NOT EXISTS is_branch_admin BOOLEAN NOT NULL DEFAULT FALSE"
            )
        )
        conn.execute(text("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS sede TEXT"))
        conn.execute(
            text("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS plain_password TEXT")
        )
        conn.execute(text("ALTER TABLE IF EXISTS users ALTER COLUMN email DROP NOT NULL"))
        conn.execute(text("UPDATE users SET username = email WHERE username IS NULL"))
        conn.execute(text("ALTER TABLE IF EXISTS users ALTER COLUMN username SET NOT NULL"))
        conn.execute(
            text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users(username)")
        )
        conn.execute(
            text("ALTER TABLE IF EXISTS talleres ADD COLUMN IF NOT EXISTS sede TEXT")
        )
        conn.execute(
            text(
                "CREATE TABLE IF NOT EXISTS talleres_grupo ("
                "id SERIAL PRIMARY KEY, "
                "nombre_taller TEXT, "
                "descripcion TEXT, "
                "sede TEXT, "
                "especie TEXT, "
                "creado_en TIMESTAMP DEFAULT NOW(), "
                "creado_por_id INTEGER REFERENCES users(id)"
                ")"
            )
        )
        conn.execute(
            text(
                "ALTER TABLE IF EXISTS talleres "
                "ADD COLUMN IF NOT EXISTS taller_grupo_id INTEGER "
                "REFERENCES talleres_grupo(id)"
            )
        )
        conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_talleres_taller_grupo_id "
                "ON talleres(taller_grupo_id)"
            )
        )
        conn.execute(
            text(
                "CREATE TABLE IF NOT EXISTS alertas_subcorte ("
                "id SERIAL PRIMARY KEY, "
                "taller_id INTEGER NOT NULL REFERENCES talleres(id), "
                "sede TEXT, "
                "creado_por_id INTEGER REFERENCES users(id), "
                "nombre_subcorte TEXT, "
                "codigo_producto TEXT, "
                "peso NUMERIC(14,4), "
                "porcentaje NUMERIC(14,4), "
                "porcentaje_umbral NUMERIC(14,4), "
                "revisada BOOLEAN DEFAULT FALSE, "
                "creado_en TIMESTAMP DEFAULT NOW()"
                ")"
            )
        )
        conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_alertas_subcorte_sede "
                "ON alertas_subcorte(sede)"
            )
        )
        conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_alertas_subcorte_taller_id "
                "ON alertas_subcorte(taller_id)"
            )
        )
