from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas
from ..constants import BRANCH_LOCATIONS
from ..dependencies import get_current_active_user, get_current_admin_user
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

def _resolve_sede_registro(
    payload_sede: Optional[str], current_user: models.User
) -> Optional[str]:
    if current_user.is_admin:
        if payload_sede and payload_sede in BRANCH_LOCATIONS:
            return payload_sede
        return current_user.sede
    return current_user.sede

def _build_taller_from_payload(
    payload: schemas.TallerCreate,
    db: Session,
    current_user: models.User,
    sede_override: Optional[str] = None,
) -> models.Taller:
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

    sede_registro = _resolve_sede_registro(sede_override or payload.sede, current_user)

    taller = models.Taller(
        nombre_taller=payload.nombre_taller,
        descripcion=payload.descripcion,
        sede=sede_registro,
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
    return taller

def _serialize_taller_data(taller: models.Taller) -> dict:
    return {
        "id": taller.id,
        "nombre_taller": taller.nombre_taller,
        "descripcion": taller.descripcion,
        "sede": taller.sede,
        "peso_inicial": taller.peso_inicial,
        "peso_final": taller.peso_final,
        "porcentaje_perdida": taller.porcentaje_perdida,
        "especie": taller.especie,
        "codigo_principal": taller.codigo_principal,
        "item_principal_id": taller.item_principal_id,
        "nombre_principal": (
            taller.item_principal.nombre if taller.item_principal else None
        ),
        "taller_grupo_id": taller.taller_grupo_id,
        "creado_en": taller.creado_en,
        "subcortes": [
            schemas.TallerDetalleOut.model_validate(det)
            for det in taller.detalles
        ],
    }


def _serialize_taller(taller: models.Taller) -> schemas.TallerOut:
    return schemas.TallerOut(**_serialize_taller_data(taller))


def _serialize_taller_with_creator(
    taller: models.Taller, creador: Optional[str]
) -> schemas.TallerWithCreatorOut:
    return schemas.TallerWithCreatorOut(
        **_serialize_taller_data(taller), creado_por=creador
    )
def _map_creadores(
    db: Session, talleres: list[models.Taller]
) -> dict[int, str]:
    creador_ids = {
        taller.creado_por_id for taller in talleres if taller.creado_por_id
    }
    if not creador_ids:
        return {}

    usuarios = (
        db.query(models.User)
        .filter(models.User.id.in_(creador_ids))
        .all()
    )
    return {
        usuario.id: (usuario.full_name or usuario.username or "").strip()
        for usuario in usuarios
    }


@router.post("", response_model=schemas.TallerOut, status_code=status.HTTP_201_CREATED)
def crear_taller(
    payload: schemas.TallerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    taller = _build_taller_from_payload(payload, db, current_user)

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
        sede=taller.sede,
        peso_inicial=taller.peso_inicial,
        peso_final=taller.peso_final,
        porcentaje_perdida=taller.porcentaje_perdida,
        especie=taller.especie,
        codigo_principal=taller.codigo_principal,
        item_principal_id=taller.item_principal_id,
        taller_grupo_id=taller.taller_grupo_id,
        creado_en=taller.creado_en,
        subcortes=[
            schemas.TallerDetalleOut.model_validate(det)
            for det in taller.detalles
        ],
    )
    
@router.post(
    "/completo",
    response_model=schemas.TallerGrupoOut,
    status_code=status.HTTP_201_CREATED,
)
def crear_taller_completo(
    payload: schemas.TallerGrupoCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    if not payload.materiales:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes incluir al menos un material en el taller completo.",
        )

    sede_registro = _resolve_sede_registro(payload.sede, current_user)
    especies = {material.especie.lower() for material in payload.materiales}
    especie_grupo = payload.especie or (next(iter(especies)) if len(especies) == 1 else None)

    grupo = models.TallerGrupo(
        nombre_taller=payload.nombre_taller,
        descripcion=payload.descripcion,
        sede=sede_registro,
        especie=especie_grupo,
        creado_por_id=current_user.id,
    )

    materiales: list[models.Taller] = []
    for material in payload.materiales:
        taller = _build_taller_from_payload(
            material,
            db,
            current_user,
            sede_override=material.sede or sede_registro,
        )
        taller.grupo = grupo
        materiales.append(taller)

    grupo.materiales = materiales

    try:
        db.add(grupo)
        db.commit()
        db.refresh(grupo)
    except Exception as exc:  # pragma: no cover - defensive rollback
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo guardar el taller completo",
        ) from exc

    return schemas.TallerGrupoOut(
        id=grupo.id,
        nombre_taller=grupo.nombre_taller,
        descripcion=grupo.descripcion,
        sede=grupo.sede,
        especie=grupo.especie,
        creado_en=grupo.creado_en,
        materiales=[_serialize_taller(taller) for taller in grupo.materiales],
    )


@router.get("/completos", response_model=list[schemas.TallerGrupoListItem])
def listar_talleres_completos(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_active_user),
):
    grupos = (
        db.query(models.TallerGrupo)
        .options(selectinload(models.TallerGrupo.materiales))
        .order_by(models.TallerGrupo.creado_en.desc())
        .all()
    )
    return [
        schemas.TallerGrupoListItem(
            id=grupo.id,
            nombre_taller=grupo.nombre_taller,
            descripcion=grupo.descripcion,
            sede=grupo.sede,
            especie=grupo.especie,
            creado_en=grupo.creado_en,
            total_materiales=len(grupo.materiales),
        )
        for grupo in grupos
    ]


@router.get("/completos/{grupo_id}", response_model=schemas.TallerGrupoOut)
def obtener_taller_completo(
    grupo_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_active_user),
):
    grupo = (
        db.query(models.TallerGrupo)
        .options(selectinload(models.TallerGrupo.materiales).selectinload(models.Taller.detalles))
        .filter(models.TallerGrupo.id == grupo_id)
        .one_or_none()
    )

    if grupo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El taller completo solicitado no existe",
        )

    return schemas.TallerGrupoOut(
        id=grupo.id,
        nombre_taller=grupo.nombre_taller,
        descripcion=grupo.descripcion,
        sede=grupo.sede,
        especie=grupo.especie,
        creado_en=grupo.creado_en,
        materiales=[_serialize_taller(taller) for taller in grupo.materiales],
    )

    

@router.get("/historial", response_model=list[schemas.TallerWithCreatorOut])
def listar_historial_talleres(
    *,
    search: Optional[str] = None,
    sede: Optional[str] = None,
    especie: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    codigo_item: Optional[str] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    if start_date and end_date and end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El rango de fechas es inválido",
        )

    query = (
        db.query(models.Taller)
        .outerjoin(models.TallerDetalle)
    )

    if sede:
        query = query.filter(
            func.lower(models.Taller.sede) == sede.strip().lower()
        )

    if especie:
        query = query.filter(
            func.lower(models.Taller.especie) == especie.strip().lower()
        )

    if codigo_item:
        pattern = f"%{codigo_item.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(models.Taller.codigo_principal).like(pattern),
                func.lower(models.TallerDetalle.codigo_producto).like(pattern),
            )
        )

    if search:
        pattern = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(models.Taller.nombre_taller).like(pattern),
                func.lower(models.Taller.descripcion).like(pattern),
                func.lower(models.Taller.codigo_principal).like(pattern),
                func.lower(models.TallerDetalle.nombre_subcorte).like(pattern),
                func.lower(models.TallerDetalle.codigo_producto).like(pattern),
            )
        )

    start_dt = (
        datetime.combine(start_date, datetime.min.time()) if start_date else None
    )
    end_dt = (
        datetime.combine(end_date + timedelta(days=1), datetime.min.time())
        if end_date
        else None
    )

    if start_dt:
        query = query.filter(models.Taller.creado_en >= start_dt)
    if end_dt:
        query = query.filter(models.Taller.creado_en < end_dt)

    talleres = (
        query.options(selectinload(models.Taller.detalles))
        .order_by(models.Taller.creado_en.desc())
        .distinct()
        .all()
    )

    creador_map = _map_creadores(db, talleres)
    return [
        _serialize_taller_with_creator(taller, creador_map.get(taller.creado_por_id))
        for taller in talleres
    ]
    
@router.get("", response_model=list[schemas.TallerListItem])
def listar_talleres(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """Listar los talleres con la sumatoria de sus subcortes."""

    talleres = (
        db.query(models.Taller)
        .options(selectinload(models.Taller.detalles))
        .order_by(models.Taller.creado_en.desc())
        .all()
    )

    listado: list[schemas.TallerListItem] = []

    for taller in talleres:
        total_detalles = sum(
            (detalle.peso or Decimal("0")) for detalle in taller.detalles
        )
        total_peso = (taller.peso_final or Decimal("0")) + total_detalles

        listado.append(
            schemas.TallerListItem(
                id=taller.id,
                nombre_taller=taller.nombre_taller,
                descripcion=taller.descripcion,
                sede=taller.sede,
                peso_inicial=taller.peso_inicial or Decimal("0"),
                peso_final=taller.peso_final or Decimal("0"),
                porcentaje_perdida=taller.porcentaje_perdida,
                total_peso=total_peso,
                especie=taller.especie,
                codigo_principal=taller.codigo_principal,
                taller_grupo_id=taller.taller_grupo_id,
                creado_en=taller.creado_en,
            )
        )

    return listado

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

@router.get("/actividad/detalle", response_model=list[schemas.TallerOut])
def obtener_detalle_actividad(
    *,
    userId: int,
    fecha: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    start_dt = datetime.combine(fecha, datetime.min.time())
    end_dt = datetime.combine(fecha + timedelta(days=1), datetime.min.time())

    talleres = (
        db.query(models.Taller)
        .filter(models.Taller.creado_por_id == userId)
        .filter(models.Taller.creado_en >= start_dt)
        .filter(models.Taller.creado_en < end_dt)
        .order_by(models.Taller.creado_en.asc())
        .all()
    )

    return [_serialize_taller(taller) for taller in talleres]

    
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
        
    def _normalizar_sede(value: Optional[str]) -> Optional[str]:
        if value is None:
            return None

        normalized = value.strip()
        return normalized or None
        
    start_dt = datetime.combine(startDate, datetime.min.time())
    end_dt = datetime.combine(endDate + timedelta(days=1), datetime.min.time())
    
    usuarios_activos = (
        db.query(models.User)
        .filter(models.User.is_active.is_(True))
        .order_by(models.User.sede, models.User.username)
        .all()
    )

    actividad: dict[tuple[int, str | None], dict] = {}
    user_map = {user.id: user for user in usuarios_activos}

    for user in usuarios_activos:
        sede_usuario = _normalizar_sede(user.sede)
        if sede_usuario:
            actividad[(user.id, sede_usuario)] = {
                "user_id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "sede": sede_usuario,
                "dias": [],
            }

    sede_resuelta = func.coalesce(
        func.nullif(func.trim(models.Taller.sede), ""),
        func.nullif(func.trim(models.User.sede), ""),
    )
    taller_completo_id = func.coalesce(models.Taller.taller_grupo_id, models.Taller.id)

        
    rows = (
        db.query(
            models.User.id.label("user_id"),
            sede_resuelta.label("sede"),
            func.date(models.Taller.creado_en).label("fecha"),
            func.count(func.distinct(taller_completo_id)).label("cantidad"),
        )
        .join(models.Taller, models.Taller.creado_por_id == models.User.id)
        .filter(models.Taller.creado_en >= start_dt)
        .filter(models.Taller.creado_en < end_dt)
        .filter(models.User.is_active.is_(True))
        .filter(sede_resuelta.isnot(None))
        .group_by(
            models.User.id,
            sede_resuelta,
            func.date(models.Taller.creado_en),
        )
        .order_by(
            sede_resuelta,
            models.User.username,
            func.date(models.Taller.creado_en),
        )
        .all()
    )
    for row in rows:
        user = user_map.get(row.user_id)
        if user is None:
            continue

        sede_row = _normalizar_sede(row.sede)
        if sede_row is None:
            continue

        key = (row.user_id, sede_row)
        if key not in actividad:
            actividad[key] = {
                "user_id": row.user_id,
                "username": user.username,
                "full_name": user.full_name,
                "sede": sede_row,
                "dias": [],
            }

        actividad[key]["dias"].append(
            {"fecha": row.fecha, "cantidad": int(row.cantidad)}
        )

    return list(actividad.values())


@router.get("/{taller_id}", response_model=schemas.TallerWithCreatorOut)
def obtener_taller_por_id(
    taller_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    taller = db.get(models.Taller, taller_id)
    if taller is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El taller solicitado no existe",
        )

    creador = None
    if taller.creado_por_id:
        creador_usuario = db.get(models.User, taller.creado_por_id)
        if creador_usuario:
            creador = (creador_usuario.full_name or creador_usuario.username or "").strip()

    return _serialize_taller_with_creator(taller, creador)


@router.put("/{taller_id}", response_model=schemas.TallerWithCreatorOut)
def actualizar_taller(
    taller_id: int,
    payload: schemas.TallerUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user),
):
    del current_admin  # solo se usa para validar permisos

    taller = db.get(models.Taller, taller_id)
    if taller is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El taller solicitado no existe",
        )

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

    taller.nombre_taller = payload.nombre_taller
    taller.descripcion = payload.descripcion
    taller.sede = payload.sede or taller.sede
    taller.peso_inicial = peso_inicial
    taller.peso_final = peso_final
    taller.porcentaje_perdida = porcentaje_perdida
    taller.especie = payload.especie.lower()
    taller.item_principal_id = item_principal_id
    taller.codigo_principal = payload.codigo_principal

    nuevos_detalles: list[models.TallerDetalle] = []
    for det in payload.subcortes:
        detalle_item_id = det.item_id or _find_item_id_by_code(db, det.codigo_producto)
        detalle = models.TallerDetalle(
            codigo_producto=det.codigo_producto,
            nombre_subcorte=det.nombre_subcorte,
            peso=Decimal(det.peso),
            item_id=detalle_item_id,
        )
        nuevos_detalles.append(detalle)

    try:
        taller.detalles = nuevos_detalles
        db.add(taller)
        db.commit()
        db.refresh(taller)
    except Exception as exc:  # pragma: no cover - defensive rollback
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo actualizar el taller",
        ) from exc

    creador_map = _map_creadores(db, [taller])
    creador = creador_map.get(taller.creado_por_id)
    return _serialize_taller_with_creator(taller, creador)


@router.delete("/{taller_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_taller(
    taller_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin_user),
):
    taller = db.get(models.Taller, taller_id)
    if taller is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El taller solicitado no existe",
        )

    try:
        db.delete(taller)
        db.commit()
    except Exception as exc:  # pragma: no cover - defensive rollback
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo eliminar el taller",
        ) from exc

    return None