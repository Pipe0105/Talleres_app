from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_active_user
from ..models import Corte, Item, Taller, TallerDetalle
from ..schemas import (
    TallerCalculoRow,
    TallerCreatePayload,
    TallerListItem,
    TallerOut,
)
router = APIRouter(
    prefix="/talleres",
    tags=["talleres"],
    dependencies=[Depends(get_current_active_user)],
)

@router.post("", response_model=TallerOut)
def crear_taller(payload: TallerCreatePayload, db: Session = Depends(get_db)):
    if not payload.detalles:
        raise HTTPException(status_code=400, detail="debes incluir al menos un detaller")
    
    taller = Taller(
        nombre_taller=payload.nombre_taller.strip(),
        descripcion=payload.descripcion.strip() if payload.descripcion else None,
    )
    if not taller.nombre_taller:
        raise HTTPException(status_code=400, detail="el nombre del taller es obligatorio")
    
    db.add(taller)
    db.flush()
    
    for detalle in payload.detalles:
        item = db.get(Item, detalle.item_id)
        if not item:
            raise HTTPException(status_code=404, detail=f"item {detalle.item_id} no existe")
        
        corte = db.get(Corte, detalle.corte_id)
        if not corte:
            raise HTTPException(
                status_code=400, detail=f"corte {detalle.corte_id} no existe"
            )
            
        if corte.item_id != detalle.item_id:
            raise HTTPException(
                status_code=400,
                detail="el corte seleccionado no pertenece al item indicado"
            )
            
        db.add(
            TallerDetalle(
                taller_id=taller.id,
                item_id=detalle.item_id,
                corte_id=detalle.corte_id,
                peso=detalle.peso,
            )
        )
    
    db.flush()
    db.refresh(taller)
    
    return TallerOut(id=taller.id, nombre_taller=taller.nombre_taller, descripcion=taller.descripcion)

@router.get("/", response_model=list[TallerListItem])
def listar_talleres(db: Session = Depends(get_db)):
    resultados = (
        db.query(
            Taller.id,
            Taller.nombre_taller,
            Taller.descripcion,
            func.coalesce(func.sum(TallerDetalle.peso), 0).label("total_peso"),
            func.count(TallerDetalle.id).label("detalles_count"),
        )
        .outerjoin(TallerDetalle, TallerDetalle.taller_id == Taller.id)
        .group_by(Taller.id)
        .order_by(Taller.id.desc())
        .all()
    )
    
    talleres: list[TallerListItem] = []
    for row in resultados:
        total_peso = _to_float(row.total_peso)
        detalles_count = int(row.detalles_count or 0)
        talleres.append(
            TallerListItem(
                id = row.id,
                nombre_taller = row.nombre_taller,
                descripcion = row.descripcion,
                total_peso = total_peso,
                detalles_count= detalles_count,
            )
        )
    return talleres

def _to_float(value: Decimal | float | int | None) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)

@router.get("/{taller_id}/calculo", response_model=list[TallerCalculoRow])
def ver_calculo(taller_id: int, db: Session = Depends(get_db)):
    total_peso_subquery = (
        db.query(
            TallerDetalle.taller_id.label("taller_id"),
            func.sum(TallerDetalle.peso).label("total_peso"),
        )
        .filter(TallerDetalle.taller_id == taller_id)
        .group_by(TallerDetalle.taller_id)
        .subquery()
    )

    rows = (
        db.query(
            TallerDetalle.taller_id,
            Corte.nombre_corte,
            Item.item_code,
            Item.descripcion,
            Item.precio_venta,
            TallerDetalle.peso,
            total_peso_subquery.c.total_peso,
            Corte.porcentaje_default,
        )
        .join(Corte, TallerDetalle.corte_id == Corte.id)
        .join(Item, TallerDetalle.item_id == Item.id)
        .join(
            total_peso_subquery,
            total_peso_subquery.c.taller_id == TallerDetalle.taller_id,
        )
        .filter(TallerDetalle.taller_id == taller_id)
        .order_by(Corte.nombre_corte)
        .all()
    )
    if not rows:
        raise HTTPException(status_code=404, detail="taller no encontrado o sin detalles")
    resultados: list[dict] = []
    for row in rows:
        peso = _to_float(row.peso)
        peso_total = _to_float(row.total_peso)
        porcentaje_default = _to_float(row.porcentaje_default)
        precio = _to_float(row.precio_venta)
        porcentaje_real = (peso / peso_total * 100) if peso_total else 0.0
        delta_pct = porcentaje_real - porcentaje_default
        valor_estimado = precio * peso
        resultados.append(
            {
                "taller_id": row.taller_id,
                "nombre_corte": row.nombre_corte,
                "item_code": row.item_code,
                "descripcion": row.descripcion,
                "precio_venta": precio,
                "peso": peso,
                "peso_total": peso_total,
                "porcentaje_default": porcentaje_default,
                "porcentaje_real": porcentaje_real,
                "delta_pct": delta_pct,
                "valor_estimado": valor_estimado,
            }
        )
        
    return resultados


