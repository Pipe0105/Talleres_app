from typing import Iterable, Optional
from sqlalchemy.orm import Session
from . import models

def upsert_items(db: Session, rows: Iterable[dict]) -> list[models.Item]:
    out = []
    for row in rows:
        obj = db.query(models.Item).filter(models.Item.item_code == row["item_code"]).one_or_none()
        if obj:
            obj.descripcion = row["descripcion"]
            obj.precio_venta = row["precio_venta"]
            obj.fuente_archivo = row["fuente_archivo"]
            if row.get("especie"):
                obj.especie = row["especie"]
        else:
            obj = models.Item(**row)
            db.add(obj)
        out.append(obj)
    return out

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.get(models.User, user_id)

def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    normalized = username.strip().lower()
    return (
        db.query(models.User)
        .filter(models.User.username.ilike(normalized))
        .one_or_none()
    )

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    normalized = email.strip().lower()
    return (
        db.query(models.User)
        .filter(models.User.email.ilike(normalized))
        .one_or_none()
    )

def get_user_by_identifier(db: Session, identifier: str) -> Optional[models.User]:
    user = get_user_by_username(db, identifier)
    if user:
        return user
    return get_user_by_email(db, identifier)

def create_user(
    db: Session,
    *,
    username: str,
    email: Optional[str] = None,
    hashed_password: str,
    plain_password: Optional[str] = None,
    full_name: Optional[str] = None,
    is_active: bool = True,
    is_admin: bool = False,
    is_gerente: bool = False,
    is_coordinator: bool = False,
    is_branch_admin: bool = False,
    sede: Optional[str] = None,
) -> models.User:
    normalized_username = username.strip().lower()
    normalized_email = email.strip().lower() if email else None
    user = models.User(
        username=normalized_username,
        email=normalized_email,
        hashed_password = hashed_password,
        plain_password = plain_password,
        full_name = full_name,
        is_active = is_active,
        is_admin = is_admin,
        is_gerente=is_gerente,
        is_coordinator=is_coordinator,
        is_branch_admin=is_branch_admin,
        sede=sede,
    )
    db.add(user)
    db.flush()
    db.refresh(user)
    return user

def list_users(db: Session) -> list[models.User]:
    return db.query(models.User).order_by(models.User.creado_en.desc()).all()

def list_operarios_by_sede(db: Session, sede: str) -> list[models.User]:
    return (
        db.query(models.User)
        .filter(
            models.User.sede == sede,
            models.User.is_admin.is_(False),
            models.User.is_gerente.is_(False),
            models.User.is_coordinator.is_(False),
            models.User.is_branch_admin.is_(False),
        )
        .order_by(models.User.creado_en.desc())
        .all()
    )
    
def list_users_by_sede(db: Session, sede: str) -> list[models.User]:
    return (
        db.query(models.User)
        .filter(models.User.sede == sede)
        .order_by(models.User.creado_en.desc())
        .all()
    )

def update_user(
    db: Session,
    user: models.User,
    *,
    username: Optional[str] = None,
    email: Optional[str] = None,
    full_name: Optional[str] = None,
    hashed_password: Optional[str] = None,
    plain_password: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_admin: Optional[bool] = None,
    is_gerente: Optional[bool] = None,
    is_coordinator: Optional[bool] = None,
    is_branch_admin: Optional[bool] = None,
    sede: Optional[str] = None,
) -> models.User:
    if username is not None:
        user.username = username.strip().lower()
    if email is not None:
        user.email = email.strip().lower()
    if full_name is not None:
        user.full_name = full_name
    if hashed_password is not None:
        user.hashed_password = hashed_password
    if plain_password is not None:
        user.plain_password = plain_password
    if is_active is not None:
        user.is_active = is_active
    if is_admin is not None:
        user.is_admin = is_admin
        
    if is_gerente is not None:
        user.is_gerente = is_gerente
    if is_coordinator is not None:
        user.is_coordinator = is_coordinator
    if is_branch_admin is not None:
        user.is_branch_admin = is_branch_admin
    if sede is not None:
        user.sede = sede
    
    db.add(user)
    db.flush()
    db.refresh(user)
    return user

def delete_user(db: Session, user: models.User) -> None:
    db.delete(user)
