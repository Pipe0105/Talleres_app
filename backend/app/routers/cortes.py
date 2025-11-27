from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_active_user, get_current_admin_user

from ..models import Corte, Item
from ..schemas import CorteIn, CorteOut

router = APIRouter(
    prefix="/cortes",
    tags=["cortes"],
    dependencies=[Depends(get_current_active_user)],
)
@router.post("/", response_model=CorteOut)
def crear_corte(
    payload: CorteIn,
    db: Session = Depends(get_db),
    _: None = Depends(get_current_admin_user),
):
    item = db.get(Item, payload.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="item no existe")
    corte = Corte(
        item_id=payload.item_id,
        nombre_corte=payload.nombre_corte.upper().strip(),
        porcentaje_default=payload.porcentaje_default,
    )
    db.add(corte)
    db.flush()
    return corte

@router.get("/por-item/{item_id}", response_model=list[CorteOut])
def cortes_por_item(item_id: int, db: Session = Depends(get_db)):
    return db.query(Corte).filter(Corte.item_id == item_id).order_by(Corte.nombre_corte).all()
