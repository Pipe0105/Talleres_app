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

@router.get("", response_model=list[ListaPreciosOut])
def listar_items(db: Session = Depends(get_db)):
    registros = (
        db.query(ListaPrecios)
        .filter(ListaPrecios.activo == True)
        .order_by(ListaPrecios.referencia, ListaPrecios.lista_id)
        .all()
    )

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
                codigo_producto=item.referencia,
                lista_id=item.lista_id,
                referencia=item.referencia,
                location=item.location,
                sede=item.sede,
                descripcion=item.descripcion,
                precio=precio,
                especie=None,
                fecha_vigencia=item.fecha_vigencia,
                fecha_activacion=item.fecha_activacion,
                unidad=item.unidad,
                fuente=item.source_file,
                file_hash=item.file_hash,
                ingested_at=item.ingested_at,
                activo=item.activo,
            )
        )

    return items
