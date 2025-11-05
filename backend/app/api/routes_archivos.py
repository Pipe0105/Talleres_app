from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ..db import get_db
from ..models.archivos_taller import ArchivoTaller
from ..models.talleres import Taller
from ..schemas.archivos_taller import ArchivoOut
from ..services.storage_service import storage_service


router = APIRouter(prefix="/archivos", tags=["Archivos"])


@router.post("", status_code=201)
async def upload_archivo(
    taller_id: int = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Taller).where(Taller.id == taller_id))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(404, detail="Taller no encontrado")

    filename, path = await storage_service.save_taller_file(taller_id, file)
    a = ArchivoTaller(taller_id=taller_id, filename=filename, path=path)
    db.add(a)
    await db.commit()
    await db.refresh(a)
    return {"id": a.id, "filename": a.filename, "path": a.path}

@router.get("/{taller_id}", response_model=List[ArchivoOut])
async def list_archivos(taller_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ArchivoTaller).where(ArchivoTaller.taller_id == taller_id))
    return res.scalars().all()



@router.delete("/{archivo_id}", status_code=204)
async def delete_archivo(archivo_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ArchivoTaller).where(ArchivoTaller.id == archivo_id))
    a = res.scalar_one_or_none()
    if not a:
        return
    await db.delete(a)
    await db.commit()