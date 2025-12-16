from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..dependencies import get_current_active_user
from ..database import get_db


router = APIRouter(
    prefix="/talleres",
    tags=["talleres"],
)


def _find_item_id_by_code(db: Session, codigo: Optional[str]) -> Optional[int]:
    if not codigo:
        return None
    item = (
        db.query(models.Item)
        .filter(models.Item.item_code == codigo)
        .one_or_none()
    )
    return item.id if item else None


@router.post("", response_model=schemas.TallerOut, status_code=status.HTTP_201_CREATED)
def crear_taller(
    payload: schemas.TallerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    peso_inicial = Decimal(payload.peso_inicial)
    peso_final = Decimal(payload.peso_final)

    total_subcortes = sum(Decimal(det.peso) for det in payload.subcortes)
    total_procesado = peso_final + total_subcortes
    perdida = peso_inicial - total_procesado
    porcentaje_perdida = (
        (perdida / peso_inicial * Decimal("100")) if peso_inicial > 0 else None
    )

    item_principal_id = payload.item_principal_id or _find_item_id_by_code(
        db, payload.codigo_principal
    )

    taller = models.Taller(
        nombre_taller=payload.nombre_taller,
        descripcion=payload.descripcion,
        peso_inicial=peso_inicial,
        peso_final=peso_final,
        porcentaje_perdida=porcentaje_perdida,
        especie=payload.especie.lower(),
        item_principal_id=item_principal_id,
        codigo_principal=payload.codigo_principal,
        creado_por_id=current_user.id,
    )

    detalles: list[models.TallerDetalle] = []
    for det in payload.subcortes:
        detalle_item_id = det.item_id or _find_item_id_by_code(db, det.codigo_producto)
        detalle = models.TallerDetalle(
            codigo_producto=det.codigo_producto,
            nombre_subcorte=det.nombre_subcorte,
            peso=Decimal(det.peso),
            item_id=detalle_item_id,
        )
        detalles.append(detalle)
    taller.detalles = detalles

    try:
        db.add(taller)
        db.commit()
        db.refresh(taller)
    except Exception as exc:  # pragma: no cover - defensive rollback
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo guardar el taller",
        ) from exc

    return schemas.TallerOut(
        id=taller.id,
        nombre_taller=taller.nombre_taller,
        descripcion=taller.descripcion,
        peso_inicial=taller.peso_inicial,
        peso_final=taller.peso_final,
        porcentaje_perdida=taller.porcentaje_perdida,
        especie=taller.especie,
        codigo_principal=taller.codigo_principal,
        item_principal_id=taller.item_principal_id,
        creado_en=taller.creado_en,
        subcortes=[
            schemas.TallerDetalleOut.model_validate(det)
            for det in taller.detalles
        ],
    )