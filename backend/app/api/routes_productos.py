from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..db import get_db
from ..models.productos import Producto
from ..schemas.productos import ProductoOut, ProductoCreate
from typing import List
import json
from pathlib import Path

from backend.app import db


router = APIRouter(prefix="/productos", tags=["Productos"])


@router.get("", response_model=List[ProductoOut])
async def list_productos(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Producto))
    return res.scalars().all()



@router.post("", response_model=ProductoOut, status_code=201)
async def create_producto(payload: ProductoCreate, db: AsyncSession = Depends(get_db)):
    p = Producto(**payload.model_dump())
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return p


@router.post("/seed", status_code=201)
async def seed_productos(db: AsyncSession = Depends(get_db)):
    
# Carga productos desde data/productos_seed.json si la tabla está vacía
    res = await db.execute(select(Producto))
    if res.scalars().first():
        return {"detail": "Ya existen productos. Seed no aplicado."}

seed_path = Path(__file__).resolve().parents[2] / "data" / "productos_seed.json"
if not seed_path.exists():
    raise HTTPException(500, detail="Archivo de seed no encontrado")

items = json.loads(seed_path.read_text(encoding="utf-8"))
for it in items:
    db.add(Producto(**it))
    await db.commit()
    return {"detail": f"Seed insertó {len(items)} productos"}