from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ..db import get_db
from ..models.talleres import Taller
from ..models.productos import Producto
from ..schemas.talleres import TallerCreate, TallerOut, TallerPatch
from backend.app import db


router = APIRouter(prefix="/talleres", tags=["Talleres"])


@router.post("", response_model=TallerOut, status_code=201)
async def create_taller(payload: TallerCreate, db: AsyncSession = Depends(get_db)):
    prod = await db.execute(select(Producto).where(Producto.id == payload.producto_id))
    if not prod.scalar_one_or_none():
        raise HTTPException(400, detail="Producto no existe")
    t = Taller(**payload.model_dump())
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return t


@router.get("", response_model=List[TallerOut])
async def list_talleres(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Taller))
    return res.scalars().unique().all()



@router.get("/{taller_id}", response_model=TallerOut)
async def get_taller(taller_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Taller).where(Taller.id == taller_id))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(404, detail="Taller no encontrado")
    return t



@router.patch("/{taller_id}", response_model=TallerOut)
async def patch_taller(taller_id: int, payload: TallerPatch, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Taller).where(Taller.id == taller_id))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(404, detail="Taller no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    await db.commit()
    await db.refresh(t)
    return t


@router.delete("/{taller_id}", status_code=204)
async def delete_taller(taller_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Taller).where(Taller.id == taller_id))
    t = res.scalar_one_or_none()
    if not t:
        return
    await db.delete(t)
    await db.commit()