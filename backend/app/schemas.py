from pydantic import BaseModel, ConfigDict, condecimal
from typing import List, Optional
from uuid import UUID

class ItemIn(BaseModel):
    item_code: str
    descripcion: str
    precio_venta: condecimal(ge=0, max_digits=14, decimal_places=4)

class ItemOut(ItemIn):
    id: UUID
    model_config = ConfigDict(from_attributes=True)

class CorteIn(BaseModel):
    item_id: UUID
    nombre_corte: str
    porcentaje_default: condecimal(ge=0, max_digits=7, decimal_places=4)

class CorteOut(CorteIn):
    id: UUID
    model_config = ConfigDict(from_attributes=True)

class TallerIn(BaseModel):
    item_id: UUID
    unidad_base: Optional[str] = "KG"
    observaciones: Optional[str] = None

class TallerDetalleIn(BaseModel):
    corte_id: UUID
    peso: condecimal(ge=0, max_digits=14, decimal_places=4)

class TallerCreatePayload(TallerIn):
    detalles: List[TallerDetalleIn]

class TallerOut(BaseModel):
    id: UUID
    item_id: UUID
    model_config = ConfigDict(from_attributes=True)
