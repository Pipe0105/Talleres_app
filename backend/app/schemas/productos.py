from pydantic import BaseModel, Field


class ProductoBase(BaseModel):
    sku: str = Field(...)
    nombre: str
    categoria: str
    precio: float
    unidad: str = "und"


class ProductoCreate(ProductoBase):
    pass


class ProductoOut(ProductoBase):
    id: int

    class Config:
        from_attributes = True