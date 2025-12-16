from datetime import date, datetime
from typing import Optional, Annotated
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, condecimal, field_validator


class ItemIn(BaseModel):
    item_code: str
    descripcion: str
    precio_venta: condecimal(ge=0, max_digits=14, decimal_places=4)  # type: ignore


class ItemOut(BaseModel):
    id: int
    item_code: str
    descripcion: str
    precio_venta: Optional[float] = None
    actualizado_en: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    
    sede: Optional[str] = None
    
    @field_validator("username")
    @classmethod
    def _validate_username(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("el nombre de usuario es obligatorio")
        return normalized

    @field_validator("sede")
    @classmethod
    def _validate_sede(cls, value: Optional[str]) -> Optional[str]:
        from .constants import BRANCH_LOCATIONS

        if value is None:
            return value

        normalized = value.strip()
        if not normalized:
            return None

        if normalized not in BRANCH_LOCATIONS:
            raise ValueError("La sede no es válida. Usa una de las sedes configuradas.")

        return normalized


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    is_gerente: bool
    creado_en: datetime
    actualizado_en: datetime
    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    username: str
    password: str


class UserAdminCreate(UserCreate):
    is_active: bool = True
    is_admin: bool = False
    is_gerente: bool = False


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    is_gerente: Optional[bool] = None
    sede: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: int
    exp: Optional[int] = None
    model_config = ConfigDict(extra="ignore")
    
    
class ListaPreciosOut(BaseModel):
    id: int
    codigo_producto: str
    descripcion: str
    precio: float | None
    especie: str | None
    fecha_vigencia: datetime | None
    fuente: str | None
    activo: bool | None
    
    model_config = ConfigDict(from_attributes=True)


class TallerDetalleCreate(BaseModel):
    codigo_producto: str
    nombre_subcorte: str
    peso: Annotated[
    Decimal,
    condecimal(ge=0, max_digits=14, decimal_places=4)
]
    item_id: Optional[int] = None


class TallerCreate(BaseModel):
    nombre_taller: str
    descripcion: Optional[str] = None
    peso_inicial: Annotated[
    Decimal,
    condecimal(ge=0, max_digits=14, decimal_places=4)
]

    peso_final: Annotated[
    Decimal,
    condecimal(ge=0, max_digits=14, decimal_places=4)
]
    especie: str
    item_principal_id: Optional[int] = None
    codigo_principal: str
    subcortes: list[TallerDetalleCreate]

    @field_validator("especie")
    @classmethod
    def _validate_especie(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"res", "cerdo"}:
            raise ValueError("La especie debe ser 'res' o 'cerdo'.")
        return normalized


class TallerDetalleOut(BaseModel):
    id: int
    codigo_producto: str
    nombre_subcorte: str
    peso: Decimal
    item_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class TallerOut(BaseModel):
    id: int
    nombre_taller: str
    descripcion: Optional[str]
    peso_inicial: Decimal
    peso_final: Decimal
    porcentaje_perdida: Decimal | None
    especie: str
    codigo_principal: str
    item_principal_id: Optional[int] = None
    creado_en: datetime
    subcortes: list[TallerDetalleOut]

    model_config = ConfigDict(from_attributes=True)
    
class TallerActividadDia(BaseModel):
    fecha: date
    cantidad: int
    
class TallerActividadUsuarioOut(BaseModel):
    user_id: int
    username: str
    full_name: Optional[str] = None
    sede: Optional[str] = None
    dias: list[TallerActividadDia]