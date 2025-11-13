from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Item
from ..schemas import ItemOut


router = APIRouter(
    prefix="/items",
    tags=["items"],
)

@router.get("/", response_model=list[ItemOut])
def listar_items(db: Session = Depends(get_db)):
    registros = db.query(Item).order_by(Item.item_code).all()

    items: list[ItemOut] = []
    for item in registros:
        precio_raw = item.precio_venta
        if isinstance(precio_raw, Decimal):
            precio: float | None = float(precio_raw)
        else:
            precio = float(precio_raw) if precio_raw is not None else None

        items.append(
            ItemOut(
                id=item.id,
                item_code=item.item_code,
                descripcion=item.descripcion,
                precio_venta=precio,
                actualizado_en=item.actualizado_en,
            )
        )

    return items
