from sqlalchemy import String, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from ..db import Base


class Producto(Base):
    __tablename__ = "productos"


id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
sku: Mapped[str] = mapped_column(String(64), unique=True, index=True)
nombre: Mapped[str] = mapped_column(String(255), index=True)
categoria: Mapped[str] = mapped_column(String(120), index=True)
precio: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
unidad: Mapped[str] = mapped_column(String(16), default="und")