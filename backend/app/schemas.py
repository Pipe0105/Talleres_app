from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, condecimal



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
    item_id: int
    unidad_base: Optional[str] = "KG"
    observaciones: Optional[str] = None

class TallerDetalleIn(BaseModel):
    corte_id: int
    peso: condecimal(ge=0, max_digits=14, decimal_places=4) # type: ignore

class TallerCreatePayload(TallerIn):
    detalles: List[TallerDetalleIn]

class TallerOut(BaseModel):
    id: int
    item_id: int
    model_config = ConfigDict(from_attributes=True)
    
class TallerListItem(BaseModel):
    id: int
    item_id: int
    fecha: datetime
    unidad_base: str
    observaciones: Optional[str] = None
    
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
    email: EmailStr
    full_name: Optional[str] = None
    
class UserCreate(UserBase):
    password: str
    
class UserOut(UserBase):
    id: int
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
    sub: int
    exp: Optional[int] = None
    model_config = ConfigDict(extra="ignore")