from sqlalchemy import Column, Integer, Text, Numeric, TIMESTAMP, func, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .database import Base

class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, autoincrement=True)
    item_code = Column(Text, unique=True, nullable=False)
    descripcion = Column(Text, nullable=False)
    precio_venta = Column(Numeric(14,4), nullable=False)
    fuente_archivo = Column(Text)
    creado_en = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    actualizado_en = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    cortes = relationship("Corte", back_populates="item", cascade="all, delete-orphan")

class Corte(Base):
    __tablename__ = "cortes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    item_id = Column(Integer(as_uuid=True), ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    nombre_corte = Column(Text, nullable=False)
    porcentaje_default = Column(Numeric(7,4), nullable=False)
    item = relationship("Item", back_populates="cortes")

class Taller(Base):
    __tablename__ = "talleres"
    id = Column(Integer, primary_key=True, autoincrement=True)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    fecha = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    unidad_base = Column(Text, default="KG")
    observaciones = Column(Text)

class TallerDetalle(Base):
    __tablename__ = "taller_detalles"
    id = Column(Integer, primary_key=True, autoincrement=True)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    corte_id = Column(Integer, ForeignKey("cortes.id"), nullable=False)
    peso = Column(Numeric(14,4), nullable=False)

class PreciosRechazados(Base):
    __tablename__ = "precios_rechazados"
    id = Column(Integer, primary_key=True, autoincrement=True)
    raw_item = Column(Text)
    raw_descripcion = Column(Text)
    raw_precio = Column(Text)
    motivo = Column(Text)
    fuente_archivo = Column(Text)
    creado_en = Column(TIMESTAMP, server_default=func.now(), nullable=False)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(Text, unique=True, nullable=False)
    full_name = Column(Text)
    hashed_password = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, server_default="true")
    creado_en = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    actualizado_en = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)