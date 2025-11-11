from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_active_user
from ..models import Corte, Item, Taller, TallerDetalle
from ..schemas import TallerCreatePayload, TallerOut

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

@router.get("/{taller_id}/calculo")
def ver_calculo(taller_id: str, db: Session = Depends(get_db)):
    sql = text("SELECT * FROM v_taller_calculo WHERE taller_id = :tid")
    rows = db.execute(sql, {"tid": taller_id}).mappings().all()
    if not rows:
        raise HTTPException(status_code=404, detail="taller no encontrado o sin detalles")
    return rows
