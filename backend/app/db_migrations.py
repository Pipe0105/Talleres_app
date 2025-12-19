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
        conn.execute(text("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS sede TEXT"))
        conn.execute(text("ALTER TABLE IF EXISTS users ALTER COLUMN email DROP NOT NULL"))
        conn.execute(text("UPDATE users SET username = email WHERE username IS NULL"))
        conn.execute(text("ALTER TABLE IF EXISTS users ALTER COLUMN username SET NOT NULL"))
        conn.execute(
            text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users(username)")
        )
        conn.execute(
            text("ALTER TABLE IF EXISTS talleres ADD COLUMN IF NOT EXISTS sede TEXT")
        )