from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_user_admin

router = APIRouter(prefix="/alertas", tags=["alertas"])


def _serialize_alerta(
    alerta: models.AlertaSubcorte, creador: models.User | None
) -> schemas.AlertaSubcorteOut:
    return schemas.AlertaSubcorteOut(
        id=alerta.id,
        taller_id=alerta.taller_id,
        sede=alerta.sede,
        creado_por_id=alerta.creado_por_id,
        creado_por=(creador.full_name or creador.username).strip() if creador else None,
        nombre_subcorte=alerta.nombre_subcorte,
        codigo_producto=alerta.codigo_producto,
        peso=alerta.peso,
        porcentaje=alerta.porcentaje,
        porcentaje_umbral=alerta.porcentaje_umbral,
        revisada=alerta.revisada,
        creado_en=alerta.creado_en,
    )


@router.get("/subcortes", response_model=list[schemas.AlertaSubcorteOut])
def listar_alertas_subcorte(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user_admin),
):
    query = db.query(models.AlertaSubcorte)
    if not current_user.is_admin:
        if not current_user.sede:
            return []
        query = query.filter(models.AlertaSubcorte.sede == current_user.sede)

    alertas = query.order_by(models.AlertaSubcorte.creado_en.desc()).all()
    creador_ids = {alerta.creado_por_id for alerta in alertas if alerta.creado_por_id}
    usuarios = (
        db.query(models.User).filter(models.User.id.in_(creador_ids)).all()
        if creador_ids
        else []
    )
    creador_map = {usuario.id: usuario for usuario in usuarios}
    return [
        _serialize_alerta(alerta, creador_map.get(alerta.creado_por_id))
        for alerta in alertas
    ]


@router.patch(
    "/subcortes/{alerta_id}",
    response_model=schemas.AlertaSubcorteOut,
)
def actualizar_alerta_subcorte(
    alerta_id: int,
    payload: schemas.AlertaSubcorteUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user_admin),
):
    alerta = db.get(models.AlertaSubcorte, alerta_id)
    if alerta is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La alerta solicitada no existe",
        )
    if not current_user.is_admin:
        if not current_user.sede or alerta.sede != current_user.sede:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para actualizar esta alerta",
            )

    alerta.revisada = payload.revisada
    db.add(alerta)
    db.commit()
    db.refresh(alerta)

    creador = db.get(models.User, alerta.creado_por_id) if alerta.creado_por_id else None
    return _serialize_alerta(alerta, creador)