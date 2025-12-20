"""Helpers to apply database migrations during application startup.

These are lightweight guards meant to keep schema adjustments centralized
until a full migration tool (e.g. Alembic) is wired into the project.
"""
from __future__ import annotations
import logging
from sqlalchemy import Engine, text

from sqlalchemy.engine import Connection

logger = logging.getLogger(__name__)


def _has_table_privilege(conn: Connection, table_name: str, privilege: str) -> bool:
    result = conn.execute(
        text(
            "SELECT has_table_privilege(current_user, :table_name, :privilege) "
            "AS has_privilege"
        ),
        {"table_name": table_name, "privilege": privilege},
    ).scalar_one_or_none()
    return bool(result)


def _column_exists(conn: Connection, table_name: str, column_name: str) -> bool:
    result = conn.execute(
        text(
            "SELECT EXISTS ("
            "  SELECT 1 FROM information_schema.columns "
            "  WHERE table_schema = current_schema() "
            "  AND table_name = :table_name "
            "  AND column_name = :column_name"
            ") AS exists"
        ),
        {"table_name": table_name, "column_name": column_name},
    ).scalar_one_or_none()
    return bool(result)



def apply_startup_migrations(engine: Engine) -> None:
    """Run idempotent DDL statements expected by the application.

    This keeps ad-hoc schema changes in one place instead of scattered across
    the startup hook.
    """
    with engine.begin() as conn:
        if _has_table_privilege(conn, "users", "ALTER"):
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
                text("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS sede TEXT")
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
        else:
            logger.warning(
                "Skipping user schema migrations because current user lacks ALTER "
                "privilege on 'users'."
            )

        if _has_table_privilege(conn, "talleres", "ALTER"):
            conn.execute(
                text("ALTER TABLE IF EXISTS talleres ADD COLUMN IF NOT EXISTS sede TEXT")
            )
        else:
            logger.warning(
                "Skipping talleres schema migrations because current user lacks ALTER "
                "privilege on 'talleres'."
            )

        if _has_table_privilege(conn, "talleres_detalle", "ALTER"):
            conn.execute(
                text(
                    "ALTER TABLE IF EXISTS talleres_detalle "
                    "ADD COLUMN IF NOT EXISTS unidad_medida TEXT DEFAULT 'kg'"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE IF EXISTS talleres_detalle "
                    "ADD COLUMN IF NOT EXISTS factor_conversion NUMERIC(14,4) DEFAULT 1"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE IF EXISTS talleres_detalle "
                    "ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'sin_categoria'"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE IF EXISTS talleres_detalle "
                    "ADD COLUMN IF NOT EXISTS peso_normalizado NUMERIC(14,4)"
                )
            )
        else:
            logger.warning(
                "Skipping talleres_detalle schema migrations because current user lacks "
                "ALTER privilege on 'talleres_detalle'."
            )

        if _column_exists(conn, "talleres_detalle", "peso_normalizado"):
            conn.execute(
                text(
                    "UPDATE talleres_detalle "
                    "SET peso_normalizado = COALESCE(peso_normalizado, peso)"
                )
            )
        else:
            logger.warning(
                "Skipping talleres_detalle data migration because 'peso_normalizado' "
                "column is unavailable."
            )