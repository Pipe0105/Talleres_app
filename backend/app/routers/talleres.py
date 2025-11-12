from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
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

@router.post("/", response_model=TallerOut)
def crear_taller(payload: TallerCreatePayload, db: Session = Depends(get_db)):
    if not db.get(Item, payload.item_id):
        raise HTTPException(status_code=404, detail="item no existe")
    t = Taller(item_id=payload.item_id, unidad_base=payload.unidad_base, observaciones=payload.observaciones)
    db.add(t)
    db.flush()
    for d in payload.detalles:
        if not db.get(Corte, d.corte_id):
            raise HTTPException(status_code=400, detail=f"corte {d.corte_id} no existe")
        db.add(TallerDetalle(taller_id=t.id, corte_id=d.corte_id, peso=d.peso))
    db.flush()
    return TallerOut(id=t.id, item_id=t.item_id)

@router.get("/", response_model=list[TallerListItem])
def listar_talleres(db: Session = Depends(get_db)):
    return db.query(Taller).order_by(Taller.fecha.desc()).all()


def _to_float(value: Decimal | float | int | None) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)

@router.get("/{taller_id}/calculo", response_model=list[TallerCalculoRow])
def ver_calculo(taller_id: int, db: Session = Depends(get_db)):
    sql = text("SELECT * FROM v_taller_calculo WHERE taller_id = :tid")
    rows = db.execute(sql, {"tid": taller_id}).mappings().all()
    if not rows:
        raise HTTPException(status_code=404, detail="taller no encontrado o sin detalles")
    resultados: list[dict] = []
    for row in rows:
        resultados.append(
            {
                "taller_id": row["taller_id"],
                "nombre_corte": row["nombre_corte"],
                "item_code": row["item_code"],
                "descripcion": row["descripcion"],
                "precio_venta": _to_float(row["precio_venta"]),
                "peso": _to_float(row["peso"]),
                "peso_total": _to_float(row["peso_total"]),
                "porcentaje_default": _to_float(row["porcentaje_default"]),
                "porcentaje_real": _to_float(row["porcentaje_real"]),
                "delta_pct": _to_float(row["delta_pct"]),
                "valor_estimado": _to_float(row["valor_estimado"]),
            }
        )
    return resultados


