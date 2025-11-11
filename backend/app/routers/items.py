from decimal import Decimal
from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import ItemOut
from ..dependencies import get_current_active_user


router = APIRouter(
    prefix="/items",
    tags=["items"],
    dependencies=[Depends(get_current_active_user)],
)

@router.get("/", response_model=list[ItemOut])
def listar_items(db: Session = Depends(get_db)):
    sql = text(
        """
        SELECT
            id,
            item_code,
            descripcion,
            precio_venta,
            actualizado_en
        FROM lista_precios
        ORDER BY item_code
        """
    )

    rows = db.execute(sql).mappings().all()

    items: list[ItemOut] = []
    for row in rows:
        item_id = row.get("id")
        item_code = row.get("item_code")
        descripcion = row.get("descripcion")
        precio: Any = row.get("precio_venta")
        actualizado_en = row.get("actualizado_en")

        if item_id is None and item_code is None:
            # No hay un identificador claro, se ignora el registro.
            continue

        if isinstance(precio, Decimal):
            precio_value: float | None = float(precio)
        else:
            try:
                precio_value = float(precio) if precio is not None else None
            except (TypeError, ValueError):
                precio_value = None

        normalized_id = str(item_id) if item_id is not None else str(item_code)
        normalized_code = str(item_code) if item_code is not None else normalized_id
        normalized_description = (
            str(descripcion)
            if descripcion not in (None, "")
            else normalized_code or normalized_id
        )

        items.append(
            ItemOut(
                id=normalized_id,
                item_code=normalized_code,
                descripcion=normalized_description,
                precio_venta=precio_value,
                actualizado_en=actualizado_en,
            )
        )

    return items
