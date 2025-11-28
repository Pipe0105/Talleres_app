from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .config import API_PREFIX, JWT_ALGORITHM, JWT_SECRET_KEY
from .database import get_db


oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{API_PREFIX}/auth/token")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    
    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        token_data = schemas.TokenPayload.model_validate(payload)
    except (JWTError, ValueError):
        raise credential_exception from None
    
    user = crud.get_user(db, token_data.sub)
    if user is None:
        raise credential_exception
    
    return user

def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo",
        )
    return current_user

def get_current_admin_user(
    current_user: models.User = Depends(get_current_active_user),
) -> models.User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere permisos de administrador",
        )
        
    return current_user


def get_current_manager_user(
    current_user: models.User = Depends(get_current_active_user),
) -> models.User:
    if not (current_user.is_admin or current_user.is_gerente):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de gerente o administrador",
        )
    return current_user