from sqlalchemy import Boolean, Column, Integer, Numeric, Text, TIMESTAMP, func
from sqlalchemy import String, DateTime
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
    
