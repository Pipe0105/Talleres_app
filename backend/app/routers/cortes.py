from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..database import get_db
from ..dependencies import get_current_active_user, get_current_admin_user
from ..models import Corte, Item, ListaPrecios
from ..schemas import CorteIn, CorteOut
from ..services.cortes_defaults import get_default_cortes
router = APIRouter(
    prefix="/cortes",
    tags=["cortes"],
    dependencies=[Depends(get_current_active_user)],
)

# =========================
# Crear corte (solo admin)
# =========================
@router.post("/", response_model=CorteOut)
def crear_corte(
    payload: CorteIn,
    db: Session = Depends(get_db),
    _: None = Depends(get_current_admin_user),
):
    item = db.get(Item, payload.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="El item no existe")

    corte = Corte(
        item_id=payload.item_id,
        nombre_corte=payload.nombre_corte.upper().strip(),
        porcentaje_default=payload.porcentaje_default,
    )

    db.add(corte)
    db.commit()
    db.refresh(corte)

    return corte


# =========================
# Obtener cortes por item_id
# =========================

def _get_or_create_item_from_lista(db: Session, item_id: int) -> Item | None:
    """
    Return an Item matching the given id.

    If it doesn't exist but there is a record in ``lista_precios`` with the same
    id (used by the frontend as the material identifier), create a matching
    Item so that the cortes endpoint can operate without a 404.
    """

    existing = db.get(Item, item_id)
    if existing:
        return existing

    lista = db.get(ListaPrecios, item_id)
    if not lista:
        return None
    
    existing_by_code = db.scalars(
        select(Item).where(Item.item_code == lista.codigo_producto)
    ).first()
    if existing_by_code:
        return existing_by_code

    item = Item(
        id=lista.id,
        item_code=lista.codigo_producto,
        nombre=lista.descripcion,
        descripcion=lista.descripcion,
        especie=(lista.especie or "").lower() or None,
        activo=lista.activo,
        precio_venta=lista.precio,
        fuente_archivo=lista.fuente,
    )

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/por-item/{item_id}", response_model=list[CorteOut])
def cortes_por_item(
    item_id: int,
    db: Session = Depends(get_db),
):
    item = _get_or_create_item_from_lista(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="El item no existe")

    return get_default_cortes(db, item)
