from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from .. import models, schemas
from ..constants import BRANCH_LOCATIONS
from ..database import get_db
from ..dependencies import get_current_active_user


router = APIRouter(
    prefix="/inventario",
    tags=["inventario"],
)


def _normalize_branch(raw: Optional[str]) -> Optional[str]:
    if raw is None:
        return None

    cleaned = raw.strip()
    if not cleaned:
        return None

    for branch in BRANCH_LOCATIONS:
        if branch.lower() == cleaned.lower():
            return branch

    raise HTTPException(
        status_code=400,
        detail="La sede no es válida. Usa una de las sedes configuradas.",
    )


@router.get("", response_model=list[schemas.InventarioItem])
def obtener_inventario_por_sede(
    sede: Optional[str] = None,
    search: Optional[str] = None,
    especie: Optional[str] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_active_user),
):
    sede_normalizada = _normalize_branch(sede)
    especie_normalizada = especie.strip().lower() if especie else None

    codigo_expr = func.coalesce(
        models.TallerDetalle.codigo_producto,
        models.Item.item_code,
    )

    descripcion_expr = func.coalesce(
        models.Item.nombre,
        models.TallerDetalle.nombre_subcorte,
        models.TallerDetalle.codigo_producto,
    )

    total_peso_expr = func.sum(func.coalesce(models.TallerDetalle.peso, 0))

    query = (
        db.query(
            codigo_expr.label("codigo_producto"),
            descripcion_expr.label("descripcion"),
            total_peso_expr.label("total_peso"),
            models.Taller.sede.label("sede"),
            models.Taller.especie.label("especie"),
        )
        .join(models.Taller, models.Taller.id == models.TallerDetalle.taller_id)
        .outerjoin(models.Item, models.Item.id == models.TallerDetalle.item_id)
    )

    if sede_normalizada:
        query = query.filter(func.lower(models.Taller.sede) == sede_normalizada.lower())

    if search:
        pattern = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(codigo_expr).like(pattern),
                func.lower(descripcion_expr).like(pattern),
            )
        )
    if especie_normalizada:
        query = query.filter(func.lower(models.Taller.especie) == especie_normalizada)

    rows = (
        query.group_by(
            codigo_expr,
            descripcion_expr,
            models.Taller.sede,
            models.Taller.especie,
        )
        .order_by(total_peso_expr.desc())
        .all()
    )

    inventario: list[schemas.InventarioItem] = []
    for row in rows:
        total_peso = row.total_peso if isinstance(row.total_peso, Decimal) else Decimal(row.total_peso or 0)
        inventario.append(
            schemas.InventarioItem(
                codigo_producto=row.codigo_producto or "",
                descripcion=row.descripcion or "",
                total_peso=total_peso,
                sede=row.sede,
                especie=row.especie,
            )
        )

    return inventario