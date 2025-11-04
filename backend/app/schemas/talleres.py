from pydantic import BaseModel
from typing import Optional, List
from .productos import ProductoOut


class TallerBase(BaseModel):
    titulo: str
    descripcion: str
    producto_id: int
    estado: str = "pendiente"


class TallerCreate(TallerBase):
    pass


class ArchivoTallerOut(BaseModel):
    id: int
    filename: str
    path: str

    class Config:
        from_attributes = True


class TallerOut(TallerBase):
    id: int
    producto: ProductoOut
    archivos: List[ArchivoTallerOut] = []

    class Config:
        from_attributes = True


class TallerPatch(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    producto_id: Optional[int] = None
    estado: Optional[str] = None
