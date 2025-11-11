from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import crud, models
from .. database import get_db
from ..dependencies import get_current_active_user
from ..schemas import Token, UserCreate, UserOut
from ..security import create_acces_token, get_password_hash, verify_password