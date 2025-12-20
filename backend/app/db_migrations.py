"""Helpers to apply database migrations during application startup.

These are lightweight guards meant to keep schema adjustments centralized
until a full migration tool (e.g. Alembic) is wired into the project.
"""
from __future__ import annotations
import logging
from sqlalchemy import Engine, text

from sqlalchemy.engine import Connection

logger = logging.getLogger(__name__)


def _can_alter_table(conn: Connection, table_name: str) -> bool:
    """Return True when current user is the table owner or a superuser.

    PostgreSQL does not expose an ``ALTER`` privilege for tables, so we rely on
    ownership (or superuser status) as the proxy for having rights to run the
    DDL below. The query is scoped to the current schema to avoid cross-schema
    collisions.
    """
    result = conn.execute(
        text(
            "SELECT EXISTS ("
            "  SELECT 1"
            "  FROM pg_class c"
            "  JOIN pg_namespace n ON n.oid = c.relnamespace"
            "  WHERE n.nspname = current_schema()"
            "    AND c.relname = :table_name"
            "    AND (pg_catalog.pg_get_userbyid(c.relowner) = current_user"
            "         OR (SELECT rolsuper FROM pg_roles WHERE rolname = current_user))"
            ") AS can_alter"
        ),
        {"table_name": table_name},
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
        if _can_alter_table(conn, "users"):
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
                "Skipping user schema migrations because current user is not the owner "
                "or a superuser for 'users'."
            )

        if _can_alter_table(conn, "talleres"):
            conn.execute(
                text("ALTER TABLE IF EXISTS talleres ADD COLUMN IF NOT EXISTS sede TEXT")
            )
        else:
            logger.warning(
               "Skipping talleres schema migrations because current user is not the "
                "owner or a superuser for 'talleres'."
            )

        if _can_alter_table(conn, "talleres_detalle"):
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