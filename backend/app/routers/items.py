from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ListaPrecios
from ..schemas import ListaPreciosOut

router = APIRouter(
    prefix="/items",
    tags=["items"],
)

@router.get("/", response_model=list[ListaPreciosOut])
def listar_items(db: Session = Depends(get_db)):
    registros = db.query(ListaPrecios).order_by(ListaPrecios.codigo_producto).all()

    items = []
    for item in registros:
        precio_raw = item.precio

        if isinstance(precio_raw, Decimal):
            precio = float(precio_raw)
        elif precio_raw is None:
            precio = None
        else:
            precio = float(precio_raw)

        items.append(
            ListaPreciosOut(
                id=item.id,
                codigo_producto=item.codigo_producto,
                descripcion=item.descripcion,
                precio=precio,
                especie=item.especie,
                fecha_vigencia=item.fecha_vigencia,
                fuente=item.fuente,
                activo=item.activo
            )
        )

    return items
