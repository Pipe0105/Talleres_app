from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    Numeric,
    TIMESTAMP,
    Text,
    func,
)
from sqlalchemy.orm import relationship
from .database import Base

class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, autoincrement=True)
    item_code = Column(Text, unique=True, nullable=False)
    descripcion = Column(Text, nullable=False)
    precio_venta = Column(Numeric(14, 4), nullable=False)
    fuente_archivo = Column(Text)
    creado_en = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    actualizado_en = Column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    cortes = relationship(
        "Corte", back_populates="item", cascade="all, delete-orphan"
    )
    detalles = relationship("TallerDetalle", back_populates="item")

class Corte(Base):
    __tablename__ = "cortes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    nombre_corte = Column(Text, nullable=False)
    porcentaje_default = Column(Numeric(7, 4), nullable=False)
    item = relationship("Item", back_populates="cortes")
    detalles = relationship("TallerDetalle", back_populates="corte")

class Taller(Base):
    __tablename__ = "talleres"
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre_taller = Column(Text, nullable=False)
    descripcion = Column(Text)
    creado_en = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    creado_por_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    creado_por = relationship("User")

    detalles = relationship(
        "TallerDetalle", back_populates="taller", cascade="all, delete-orphan"
    )

class TallerDetalle(Base):
    __tablename__ = "taller_detalles"
    id = Column(Integer, primary_key=True, autoincrement=True)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    corte_id = Column(Integer, ForeignKey("cortes.id"), nullable=False)
    taller_id = Column(
        Integer, ForeignKey("talleres.id", ondelete="CASCADE"), nullable=False
    )
    peso = Column(Numeric(14, 4), nullable=False)

    taller = relationship("Taller", back_populates="detalles")
    item = relationship("Item", back_populates="detalles")
    corte = relationship("Corte", back_populates="detalles")

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
    username = Column(Text, unique=True, nullable=False)
    email = Column(Text, unique=True)
    full_name = Column(Text)
    hashed_password = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, server_default="true")
    is_admin = Column(Boolean, nullable=False, server_default="false")
    is_gerente = Column(Boolean, nullable=False, server_default="false")
    sede = Column(Text)
    creado_en = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    actualizado_en = Column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False
    )
    
class ListaPrecios(Base):
    __tablename__ = "lista_precios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo_producto = Column(Text, nullable=False)
    descripcion = Column(Text, nullable=False)
    precio = Column(Numeric(12, 2), nullable=True)
    especie = Column(Text, nullable=True)
    fecha_vigencia = Column(TIMESTAMP, nullable=True)
    fuente = Column(Text, nullable=True)
    activo = Column(Boolean, nullable=True)
    
