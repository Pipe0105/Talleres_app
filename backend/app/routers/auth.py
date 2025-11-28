from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import crud, models
from ..database import get_db
from ..dependencies import get_current_active_user
from ..schemas import Token, UserCreate, UserOut
from ..security import create_access_token, get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)) -> UserOut:
    existing = crud.get_user_by_username(db, payload.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está registrado",

        )
        
    if payload.email:
        existing_email = crud.get_user_by_email(db,payload.email)
        if existing_email :
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo ya esta registrado"
            )
    
    hashed_password = get_password_hash(payload.password)
    user = crud.create_user(
        db,
        username=payload.username,
        email=payload.email,
        hashed_password=hashed_password,
        full_name=payload.full_name,
        sede=payload.sede,
    )
    return user

@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Token:
    user = crud.get_user_by_identifier(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="credenciales incorrectas",
        )
    
    access_token = create_access_token(str(user.id))
    return Token(access_token=access_token, token_type="bearer")

@router.get("/me", response_model=UserOut)
async def read_current_user(
    current_user: models.User = Depends(get_current_active_user),
) -> UserOut:
    return current_user