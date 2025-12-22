from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    TIMESTAMP,
    func,
)
from sqlalchemy.orm import relationship
from .database import Base

from datetime import datetime

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True)
    item_code = Column("codigo_producto", String)  # Código del producto
    nombre = Column(String(120))        # NUEVO: Nombre limpio usado por el frontend
    descripcion = Column(Text)          # Nombre largo o texto original del archivo
    especie = Column(String(10))        # NUEVO: "res" o "cerdo"
    activo = Column(Boolean, default=True)  # NUEVO: control de catálogo
    precio_venta = Column(Numeric(14,4))
    fuente_archivo = Column(Text)
    creado_en = Column(DateTime, default=datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
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
    plain_password = Column(Text)
    is_active = Column(Boolean, nullable=False, server_default="true")
    is_admin = Column(Boolean, nullable=False, server_default="false")
    is_gerente = Column(Boolean, nullable=False, server_default="false")
    sede = Column(Text)
    creado_en = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    actualizado_en = Column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False
    )
    
class ListaPrecios(Base):
    __tablename__ = "precios_lista"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    location = Column(Text, nullable=True)
    sede = Column(Text, nullable=True)
    lista_id = Column(Integer, nullable=True)
    referencia = Column(Text, nullable=False)
    descripcion = Column(Text, nullable=False)
    fecha_vigencia = Column(Date, nullable=True)
    precio = Column(Numeric(12, 2), nullable=True)
    unidad = Column(Text, nullable=True)
    fecha_activacion = Column(Date, nullable=True)
    source_file = Column(Text, nullable=True)
    file_hash = Column(Text, nullable=True)
    ingested_at = Column(TIMESTAMP(timezone=True), nullable=True)
    activo = Column(Boolean, nullable=True)
    


class Taller(Base):
    __tablename__ = "talleres"

    id = Column(Integer, primary_key=True)
    nombre_taller = Column(String)
    descripcion = Column(Text)
    sede = Column(String)
    creado_en = Column(DateTime, default=datetime.utcnow)
    creado_por_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    peso_inicial = Column(Numeric(14, 4))
    peso_final = Column(Numeric(14, 4))
    porcentaje_perdida = Column(Numeric(14, 4))
    especie = Column(String(10))
    item_principal_id = Column(Integer, ForeignKey("items.id"), nullable=True)
    codigo_principal = Column(Text)
    taller_grupo_id = Column(Integer, ForeignKey("talleres_grupo.id"), nullable=True)

    detalles = relationship(
        "TallerDetalle",
        back_populates="taller",
        cascade="all, delete-orphan",
    )
    grupo = relationship("TallerGrupo", back_populates="materiales")


class TallerGrupo(Base):
    __tablename__ = "talleres_grupo"

    id = Column(Integer, primary_key=True)
    nombre_taller = Column(String)
    descripcion = Column(Text)
    sede = Column(String)
    especie = Column(String(10))
    creado_en = Column(DateTime, default=datetime.utcnow)
    creado_por_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    materiales = relationship(
        "Taller",
        back_populates="grupo",
        cascade="all, delete-orphan",
    )

class TallerDetalle(Base):
    __tablename__ = "talleres_detalle"

    id = Column(Integer, primary_key=True)
    taller_id = Column(Integer, ForeignKey("talleres.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)
    codigo_producto = Column(Text)
    nombre_subcorte = Column(Text)
    peso = Column(Numeric(14, 4))
    creado_en = Column(DateTime, default=datetime.utcnow)

    taller = relationship("Taller", back_populates="detalles")
    
