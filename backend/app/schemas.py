from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, condecimal



class ItemIn(BaseModel):
    item_code: str
    descripcion: str
    precio_venta: condecimal(ge=0, max_digits=14, decimal_places=4) # type: ignore

class ItemOut(BaseModel):
    id: str
    item_code: str
    descripcion: str
    precio_venta: Optional[float] = None
    actualizado_en: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class CorteIn(BaseModel):
    item_id: UUID
    nombre_corte: str
    porcentaje_default: condecimal(ge=0, max_digits=7, decimal_places=4) # type: ignore

class CorteOut(CorteIn):
    id: UUID
    model_config = ConfigDict(from_attributes=True)

class TallerIn(BaseModel):
    item_id: UUID
    unidad_base: Optional[str] = "KG"
    observaciones: Optional[str] = None

class TallerDetalleIn(BaseModel):
    corte_id: UUID
    peso: condecimal(ge=0, max_digits=14, decimal_places=4) # type: ignore

class TallerCreatePayload(TallerIn):
    detalles: List[TallerDetalleIn]

class TallerOut(BaseModel):
    id: UUID
    item_id: UUID
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    
class UserCreate(UserBase):
    password: str
    
class UserOut(UserBase):
    id: UUID
    is_active: bool
    creado_en: datetime
    model_config = ConfigDict(from_attributes=True)
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: UUID
    exp: Optional[int] = None
    model_config = ConfigDict(extra="ignore")