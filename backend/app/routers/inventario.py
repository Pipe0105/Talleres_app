from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db


router = APIRouter(
    prefix="/inventario",
    tags=["inventario"],
)


def _normalize_decimal(value: Optional[Decimal]) -> Decimal:
    if value is None:
        return Decimal("0")
    if isinstance(value, float):
        return Decimal(str(value))
    return value


@router.get("", response_model=list[schemas.InventarioItem])
def listar_inventario(
    sede: Optional[str] = None,
    search: Optional[str] = None,
    especie: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(
            models.TallerDetalle.codigo_producto.label("codigo_producto"),
            func.max(models.TallerDetalle.nombre_subcorte).label("descripcion"),
            func.sum(models.TallerDetalle.peso_normalizado).label("total_peso"),
            models.Taller.sede.label("sede"),
            models.Taller.especie.label("especie"),
        )
        .join(models.Taller, models.TallerDetalle.taller)
        .group_by(
            models.TallerDetalle.codigo_producto,
            models.Taller.sede,
            models.Taller.especie,
        )
    )

    if sede:
        query = query.filter(func.lower(models.Taller.sede) == sede.strip().lower())

    if especie:
        query = query.filter(
            func.lower(models.Taller.especie) == especie.strip().lower()
        )

    if search:
        pattern = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(models.TallerDetalle.codigo_producto).like(pattern),
                func.lower(models.TallerDetalle.nombre_subcorte).like(pattern),
            )
        )

    resultados = (
        query.order_by(func.sum(models.TallerDetalle.peso_normalizado).desc()).all()
    )

    inventario: list[schemas.InventarioItem] = []

    for row in resultados:
        total_peso = _normalize_decimal(row.total_peso)

        inventario.append(
            schemas.InventarioItem(
                codigo_producto=row.codigo_producto,
                descripcion=row.descripcion or row.codigo_producto,
                total_peso=total_peso,
                sede=row.sede,
                especie=row.especie,
                entradas=total_peso,
                salidas_pendientes=Decimal("0"),
            )
        )

    return inventario