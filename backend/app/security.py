from datetime import datetime, timedelta
from typing import Optional

from jose import jwt
from passlib.context import CryptContext

from .config import JWT_ACCESS_TOKEN_EXPIRE_MINUTES, JWT_ALGORITHM, JWT_SECRET_KEY

# Cambiado bcrypt → argon2 para compatibilidad con Python 3.13
pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"],
    default="argon2",
    deprecated="auto",
)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a signed JWT access token."""
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
