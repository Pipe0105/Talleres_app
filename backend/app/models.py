from sqlalchemy import Column, Text, Numeric, TIMESTAMP, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .database import Base

class Item(Base):
    __tablename__ = "items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_code = Column(Text, unique=True, nullable=False)
    descripcion = Column(Text, nullable=False)
    precio_venta = Column(Numeric(14,4), nullable=False)
    fuente_archivo = Column(Text)
    creado_en = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    actualizado_en = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    cortes = relationship("Corte", back_populates="item", cascade="all, delete-orphan")

class Corte(Base):
    __tablename__ = "cortes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    nombre_corte = Column(Text, nullable=False)
    porcentaje_default = Column(Numeric(7,4), nullable=False)
    item = relationship("Item", back_populates="cortes")

class Taller(Base):
    __tablename__ = "talleres"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False)
    fecha = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    unidad_base = Column(Text, default="KG")
    observaciones = Column(Text)

class TallerDetalle(Base):
    __tablename__ = "taller_detalles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    taller_id = Column(UUID(as_uuid=True), ForeignKey("talleres.id", ondelete="CASCADE"), nullable=False)
    corte_id = Column(UUID(as_uuid=True), ForeignKey("cortes.id"), nullable=False)
    peso = Column(Numeric(14,4), nullable=False)

class PreciosRechazados(Base):
    __tablename__ = "precios_rechazados"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    raw_item = Column(Text)
    raw_descripcion = Column(Text)
    raw_precio = Column(Text)
    motivo = Column(Text)
    fuente_archivo = Column(Text)
    creado_en = Column(TIMESTAMP, server_default=func.now(), nullable=False)
