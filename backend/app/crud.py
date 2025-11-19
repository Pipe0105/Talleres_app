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
        else:
            obj = models.Item(**row)
            db.add(obj)
        out.append(obj)
    return out

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.get(models.User, user_id)

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).one_or_none()

def create_user(
    db: Session,
    *,
    email: str,
    hashed_password: str,
    full_name: Optional[str] = None,
    is_active: bool = True,
    is_admin: bool = False,
) -> models.User:
    user = models.User(
        email = email,
        hashed_password = hashed_password,
        full_name = full_name,
        is_active = is_active,
        is_admin = is_admin,
    )
    db.add(user)
    db.flush()
    db.refresh(user)
    return user

def list_users(db: Session) -> list[models.User]:
    return db.query(models.User).order_by(models.User.creado_en.desc()).all()

def update_user(
    db: Session,
    user: models.User,
    *,
    full_name: Optional[str] = None,
    hashed_password: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_admin: Optional[bool] = None,
) -> models.User:
    if full_name is not None:
        user.full_name = full_name
    if hashed_password is not None:
        user.hashed_password = hashed_password
    if is_active is not None:
        user.is_active = is_active
    if is_admin is not None:
        user.is_admin = is_admin
    
    db.add(user)
    db.flush()
    db.refresh(user)
    return user