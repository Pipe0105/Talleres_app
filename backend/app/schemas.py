from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, condecimal, field_validator




class ItemIn(BaseModel):
    item_code: str
    descripcion: str
    precio_venta: condecimal(ge=0, max_digits=14, decimal_places=4) # type: ignore

class ItemOut(BaseModel):
    id: int
    item_code: str
    descripcion: str
    precio_venta: Optional[float] = None
    actualizado_en: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class CorteIn(BaseModel):
    item_id: int
    nombre_corte: str
    porcentaje_default: condecimal(ge=0, max_digits=7, decimal_places=4) # type: ignore

class CorteOut(CorteIn):
    id: int
    model_config = ConfigDict(from_attributes=True)

class TallerIn(BaseModel):
    nombre_taller: str
    descripcion: Optional[str] = None

class TallerDetalleIn(BaseModel):
    item_id: int
    corte_id: int
    peso: condecimal(ge=0, max_digits=14, decimal_places=4) # type: ignore

class TallerCreatePayload(TallerIn):
    detalles: List[TallerDetalleIn]

class TallerOut(TallerIn):
    id: int
    model_config = ConfigDict(from_attributes=True)
    
class TallerListItem(BaseModel):
    id: int
    nombre_taller: str
    descripcion: Optional[str] = None
    total_peso: float
    detalles_count: int
    
    model_config = ConfigDict(from_attributes=True)
    
class TallerCalculoRow(BaseModel):
    taller_id: int
    nombre_corte: str
    item_code: str
    descripcion: str
    precio_venta: float
    peso: float
    peso_total: float
    porcentaje_default: float
    porcentaje_real: float
    delta_pct: float
    valor_estimado: float


class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    
    @field_validator("username")
    @classmethod
    def _validate_username(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("el nombre de usuario es obligatorio")
        return normalized


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    creado_en: datetime
    actualizado_en: datetime
    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    username: str
    password: str


class UserAdminCreate(UserCreate):
    is_active: bool = True
    is_admin: bool = False


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None


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