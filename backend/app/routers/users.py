from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, models
from ..database import get_db
from ..dependencies import get_current_admin_user
from ..schemas import UserAdminCreate, UserOut, UserUpdate
from ..security import get_password_hash

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
) -> List[UserOut]:
    return crud.list_users(db)

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserAdminCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
) -> UserOut:
    existing = crud.get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está registrado",
        )
        
    hashed_password = get_password_hash(payload.password)
    user = crud.create_user(
        db,
        email=payload.email,
        hashed_password=hashed_password,
        full_name=payload.full_name,
        is_active=payload.is_active,
        is_admin=payload.is_admin,
    )
    return user

@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin_user),
) -> UserOut:
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
    if payload.email and payload.email != user.email:
        existing_user = crud.get_user_by_email(db, payload.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo ya esta registrado",
            )
            
    hashed_password = get_password_hash(payload.password) if payload.password else None
    updated_user = crud.update_user(
        db,
        user,
        email = payload.email,
        full_name=payload.full_name,
        hashed_password=hashed_password,
        is_active=payload.is_active,
        is_admin=payload.is_admin,
    )
    return update_user

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