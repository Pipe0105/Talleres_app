from sqlalchemy import Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from ..db import Base


class Taller(Base):
    __tablename__ = "talleres"


id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
titulo: Mapped[str] = mapped_column(String(255), index=True)
descripcion: Mapped[str] = mapped_column(Text)
producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"))
estado: Mapped[str] = mapped_column(String(32), default="pendiente")
creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


producto = relationship("Producto")
archivos = relationship("ArchivoTaller", back_populates="taller", cascade="all, delete-orphan")