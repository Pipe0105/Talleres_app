from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
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
    
@router.get("", response_model=list[schemas.TallerListItem])
def obtener_talleres(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    talleres = (
        db.query(models.Taller)
        .order_by(models.Taller.creado_en.desc())
        .all()
    )
    
    result: list[schemas.TallerListItem] = []
    for taller in talleres:
        total_peso = sum((det.peso or Decimal("0")) for det in taller.detalles)
        total_peso += taller.peso_final or Decimal("0")
        
        result.append(
            schemas.TallerListItem(
                id=taller.id,
                nombre_taller=taller.nombre_taller,
                descripcion=taller.descripcion,
                peso_inicial=taller.peso_inicial,
                peso_final=taller.peso_final,
                total_peso=total_peso,
                especio=taller.especie,
                creado_en = taller.creado_en,
            )
        )
    return result

@router.get("", response_model=list[schemas.TallerListItem])
def obtener_talleres(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    talleres = (
        db.query(models.Taller)
        .order_by(models.Taller.creado_en.desc())
        .all()
    )

    result: list[schemas.TallerListItem] = []
    for taller in talleres:
        total_peso = sum((det.peso or Decimal("0")) for det in taller.detalles)
        total_peso += taller.peso_final or Decimal("0")

        result.append(
            schemas.TallerListItem(
                id=taller.id,
                nombre_taller=taller.nombre_taller,
                descripcion=taller.descripcion,
                peso_inicial=taller.peso_inicial,
                peso_final=taller.peso_final,
                total_peso=total_peso,
                especie=taller.especie,
                creado_en=taller.creado_en,
            )
        )

    return result


@router.get("/{taller_id}/calculo", response_model=list[schemas.TallerCalculoRow])
def obtener_calculo_taller(
    taller_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    taller = db.get(models.Taller, taller_id)
    if taller is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El taller solicitado no existe",
        )

    peso_inicial = Decimal(taller.peso_inicial or Decimal("0"))
    if peso_inicial < 0:
        peso_inicial = Decimal("0")

    calculo: list[schemas.TallerCalculoRow] = []
    for detalle in taller.detalles:
        peso = Decimal(detalle.peso or Decimal("0"))
        porcentaje_real = (
            (peso / peso_inicial * Decimal("100")) if peso_inicial > 0 else Decimal("0")
        )

        item = db.get(models.Item, detalle.item_id) if detalle.item_id else None
        precio_venta = Decimal(item.precio_venta or Decimal("0")) if item else Decimal("0")

        porcentaje_default = Decimal("0")
        delta_pct = porcentaje_real - porcentaje_default
        valor_estimado = peso * precio_venta

        calculo.append(
            schemas.TallerCalculoRow(
                nombre_corte=detalle.nombre_subcorte,
                descripcion=(item.nombre if item else detalle.nombre_subcorte) or "",
                item_code=(item.item_code if item else detalle.codigo_producto) or "",
                peso=peso,
                porcentaje_real=porcentaje_real,
                porcentaje_default=porcentaje_default,
                delta_pct=delta_pct,
                precio_venta=precio_venta,
                valor_estimado=valor_estimado,
            )
        )

    return calculo
    
@router.get("/actividad", response_model=list[schemas.TallerActividadUsuarioOut])
def obtener_actividad_talleres(
    *,
    startDate: date,
    endDate: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    if endDate < startDate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El rango de fechas es invalido",
        )
        
    start_dt = datetime.combine(startDate, datetime.min.time())
    end_dt = datetime.combine(endDate + timedelta(days=1), datetime.min.time())
    
    usuarios_activos = (
        db.query(models.User)
        .filter(models.User.is_active.is_(True))
        .order_by(models.User.sede, models.User.username)
        .all()
    )

    actividad: dict[int, dict] = {
        user.id: {
            "user_id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "sede": user.sede,
            "dias": [],
        }
        for user in usuarios_activos
    }
    
    rows = (
        db.query(
            models.User.id.label("user_id"),
            func.date(models.Taller.creado_en).label("fecha"),
            func.count(models.Taller.id).label("cantidad"),
        )
        .join(models.Taller, models.Taller.creado_por_id == models.User.id)
        .filter(models.Taller.creado_en >= start_dt)
        .filter(models.Taller.creado_en < end_dt)
        .filter(models.User.is_active.is_(True))
        .group_by(models.User.id, func.date(models.Taller.creado_en))
        .order_by(models.User.sede, models.User.username, func.date(models.Taller.creado_en))
        .all()
    )
    for row in rows:
        actividad[row.user_id]["dias"].append(
            {"fecha": row.fecha, "cantidad": int(row.cantidad)}
        )

    return [actividad[user.id] for user in usuarios_activos]