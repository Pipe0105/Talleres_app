import argparse
from dataclasses import dataclass

from sqlalchemy.exc import IntegrityError

from .. import crud
from ..database import SessionLocal
from ..security import get_password_hash


@dataclass
class UserPayload:
    username: str
    password: str
    email: str | None
    full_name: str | None
    is_admin: bool
    is_active: bool = True


def _parse_args() -> UserPayload:
    parser = argparse.ArgumentParser(description="Crea un usuario en la tabla users")
    parser.add_argument("--username", required=True, help="Nombre de usuario único")
    parser.add_argument("--password", required=True, help="Contraseña en texto plano")
    parser.add_argument("--email", help="Correo electrónico opcional")
    parser.add_argument("--full-name", dest="full_name", help="Nombre completo opcional")
    parser.add_argument(
        "--is-admin",
        action="store_true",
        help="Crea el usuario con permisos de super administrador",
    )
    parser.add_argument(
        "--inactive",
        action="store_true",
        help="Crea el usuario como inactivo",
    )

    args = parser.parse_args()
    return UserPayload(
        username=args.username,
        password=args.password,
        email=args.email,
        full_name=args.full_name,
        is_admin=args.is_admin,
        is_active=not args.inactive,
    )


def create_user(payload: UserPayload) -> int:
    """Crea el usuario y devuelve su ID."""

    hashed_password = get_password_hash(payload.password)

    with SessionLocal() as db:
        try:
            user = crud.create_user(
                db,
                username=payload.username,
                email=payload.email,
                hashed_password=hashed_password,
                plain_password=payload.password,
                full_name=payload.full_name,
                is_active=payload.is_active,
                is_admin=payload.is_admin,
            )
            db.commit()
            return user.id
        except IntegrityError:
            db.rollback()
            raise SystemExit(
                "El usuario ya existe (username o email duplicado). No se realizaron cambios."
            )


def main() -> None:
    payload = _parse_args()
    user_id = create_user(payload)
    print(f"Usuario creado con ID {user_id} y username '{payload.username}'")


if __name__ == "__main__":
    main()