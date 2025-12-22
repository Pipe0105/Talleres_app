from decimal import Decimal
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ListaPrecios, Item
from ..schemas import ListaPreciosOut, ItemsPageOut

router = APIRouter(
    prefix="/items",
    tags=["items"],
)

SORT_OPTIONS = {
    "descripcion": ListaPrecios.descripcion.asc(),
    "precio-asc": ListaPrecios.precio.asc().nullslast(),
    "precio-desc": ListaPrecios.precio.desc().nullslast(),
}

def _serialize_item(item: ListaPrecios, especie: str | None) -> ListaPreciosOut:
    precio_raw = item.precio
    
    if isinstance(precio_raw, Decimal):
        precio = float(precio_raw)
    elif precio_raw is None:
        precio = None
    else:
        precio = float(precio_raw)
        
    return ListaPreciosOut(
        id=item.id,
        codigo_producto=item.referencia,
        lista_id=item.lista_id,
        referencia=item.referencia,
        location=item.location,
        sede=item.sede,
        descripcion=item.descripcion,
        precio=precio,
        especie=especie,
        fecha_vigencia=item.fecha_vigencia,
        fecha_activacion=item.fecha_activacion,
        unidad=item.unidad,
        fuente=item.source_file,
        file_hash=item.file_hash,
        ingested_at=item.ingested_at,
        activo=item.activo,
    )

def _apply_filters(
    query,
    q: str | None,
    species: str | None,
    branch: str | None,
    sort: str,
):
    if q:
        search = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(ListaPrecios.referencia).like(search),
                func.lower(ListaPrecios.descripcion).like(search),
                func.lower(ListaPrecios.sede).like(search),
                func.lower(ListaPrecios.location).like(search),
            )
        )

    if branch and branch.lower() != "todas":
        branch_normalized = branch.strip().lower()
        query = query.filter(
            or_(
                func.lower(ListaPrecios.sede) == branch_normalized,
                func.lower(ListaPrecios.location) == branch_normalized,
            )
        )
        
    if species and species.lower() != "todas":
        species_normalized = species.strip().lower()
        query = query.filter(func.lower(Item.especie) == species_normalized)
    order_by = SORT_OPTIONS.get(sort, SORT_OPTIONS["descripcion"])
    return query.order_by(order_by)

def _base_query(db: Session):
    return (
        db.query(ListaPrecios, Item.especie)
        .outerjoin(Item, func.lower(Item.item_code) == func.lower(ListaPrecios.referencia))
        .filter(ListaPrecios.activo == True)
    )

@router.get("", response_model=ItemsPageOut)
def listar_items(
    db: Session = Depends(get_db),
    q: str | None = None,
    species: str | None = None,
    branch: str | None = None,
    sort: str = "descripcion",
    page: int = Query(1, ge=1),
    page_size: int = Query(25,ge=1, le=200),
):
    base_query = _base_query(db)
    filtered_query = _apply_filters(base_query, q, species, branch, sort)
    total = filtered_query.count()
    
    registros = (
        filtered_query.offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    
    items = [_serialize_item(item, especie) for item, especie in registros]
    
    return ItemsPageOut(items=items, total=total, page=page, page_size=page_size)

@router.get("/export", response_model=list[ListaPreciosOut])
def exportar_items(
    db: Session = Depends(get_db),
    q: str | None = None,
    species:str | None = None,
    branch: str | None = None,
    sort: str = "descripcion",
): 
    base_query = _base_query(db)
    registros = _apply_filters(base_query, q, species, branch, sort).all()
    return [_serialize_item(item, especie) for item, especie in registros]
