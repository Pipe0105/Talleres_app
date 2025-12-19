from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, models
from ..database import get_db
from ..dependencies import get_current_admin_user
from ..schemas import AdminUserOut, UserAdminCreate, UserUpdate
from ..security import get_password_hash

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=List[AdminUserOut])
def list_users(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
) -> List[AdminUserOut]:
    return crud.list_users(db)

@router.post("", response_model=AdminUserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserAdminCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
) -> AdminUserOut:
    existing = crud.get_user_by_username(db, payload.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está registrado",
        )
    
    if payload.email:
        existing_email = crud.get_user_by_email(db,payload.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo ya está registrado",
            )
        
    hashed_password = get_password_hash(payload.password)
    user = crud.create_user(
        db,
        username=payload.username,
        email=payload.email,
        hashed_password=hashed_password,
        full_name=payload.full_name,
        is_active=payload.is_active,
        is_admin=payload.is_admin,
        is_gerente=payload.is_gerente,
        sede=payload.sede,
    )
    return user

@router.patch("/{user_id}", response_model=AdminUserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin_user),
) -> AdminUserOut:
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    if user.id == current_admin.id:
        if payload.is_admin is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes",
            )
        if payload.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes desactivar",
            )
    if payload.username and payload.username != user.username:
        existing_user = crud.get_user_by_username(db, payload.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está registrado",
            )
            
    hashed_password = get_password_hash(payload.password) if payload.password else None
    updated_user = crud.update_user(
        db,
        user,
        username=payload.username,
        email = payload.email,
        full_name=payload.full_name,
        hashed_password=hashed_password,
        is_active=payload.is_active,
        is_admin=payload.is_admin,
        is_gerente=payload.is_gerente,
        sede=payload.sede,
    )
    return updated_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin_user),
) -> None:
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propia cuenta ",
        )
        
    crud.delete_user(db, user)