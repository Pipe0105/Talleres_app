from datetime import date, datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_active_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

COMPLETION_THRESHOLD = Decimal("0.99")
LOW_INVENTORY_THRESHOLD = Decimal("10")
TREND_WINDOW_DAYS = 7


def _to_decimal(value: Decimal | float | int | None) -> Decimal:
    if isinstance(value, Decimal):
        return value
    if value is None:
        return Decimal("0")
    try:
        return Decimal(str(value))
    except Exception:  # pragma: no cover - fallback for unexpected types
        return Decimal("0")


def _calculate_status(taller: models.Taller) -> str:
    peso_inicial = _to_decimal(taller.peso_inicial)
    total_detalles = sum(_to_decimal(detalle.peso) for detalle in taller.detalles)
    total_peso = _to_decimal(taller.peso_final) + total_detalles

    if peso_inicial <= 0:
        ratio = Decimal("0")
    else:
        ratio = total_peso / peso_inicial

    if ratio >= COMPLETION_THRESHOLD:
        return "completado"
    if ratio > 0:
        return "en-proceso"
    return "pendiente"


def _calculate_trend(current: int, previous: int) -> float | None:
    if previous == 0:
        if current == 0:
            return None
        return 100.0
    return float((current - previous) / previous * 100)


def _count_low_inventory(db: Session, start_dt: datetime | None, end_dt: datetime | None) -> int:
    query = (
        db.query(
            func.coalesce(models.TallerDetalle.codigo_producto, models.Item.item_code).label(
                "codigo_producto"
            ),
            func.sum(func.coalesce(models.TallerDetalle.peso, 0)).label("total_peso"),
        )
        .join(models.Taller, models.Taller.id == models.TallerDetalle.taller_id)
        .outerjoin(models.Item, models.Item.id == models.TallerDetalle.item_id)
    )

    if start_dt:
        query = query.filter(models.TallerDetalle.creado_en >= start_dt)
    if end_dt:
        query = query.filter(models.TallerDetalle.creado_en < end_dt)

    rows = query.group_by(
        func.coalesce(models.TallerDetalle.codigo_producto, models.Item.item_code),
    ).all()

    low_count = 0
    for row in rows:
        total_peso = _to_decimal(getattr(row, "total_peso", Decimal("0")))
        if total_peso <= LOW_INVENTORY_THRESHOLD:
            low_count += 1

    return low_count


def _count_active_users(
    db: Session, start_dt: datetime | None = None, end_dt: datetime | None = None
) -> int:
    query = db.query(func.count(models.User.id)).filter(models.User.is_active.is_(True))
    if start_dt:
        query = query.filter(models.User.creado_en >= start_dt)
    if end_dt:
        query = query.filter(models.User.creado_en < end_dt)
    return int(query.scalar() or 0)


@router.get("/resumen", response_model=schemas.DashboardStats)
def obtener_resumen_dashboard(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_active_user),
) -> schemas.DashboardStats:
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    tomorrow_start = today_start + timedelta(days=1)
    yesterday_start = today_start - timedelta(days=1)

    current_window_start = today_start - timedelta(days=TREND_WINDOW_DAYS - 1)
    previous_window_start = current_window_start - timedelta(days=TREND_WINDOW_DAYS)

    talleres = (
        db.query(models.Taller)
        .options(selectinload(models.Taller.detalles))
        .order_by(models.Taller.creado_en.desc())
        .all()
    )

    activos_total = 0
    activos_actuales = 0
    activos_previos = 0
    completados_hoy = 0
    completados_ayer = 0

    for taller in talleres:
        estado = _calculate_status(taller)
        creado_en = taller.creado_en

        if estado != "completado":
            activos_total += 1
            if creado_en and creado_en >= current_window_start:
                activos_actuales += 1
            elif creado_en and previous_window_start <= creado_en < current_window_start:
                activos_previos += 1

        if estado == "completado" and creado_en:
            if today_start <= creado_en < tomorrow_start:
                completados_hoy += 1
            elif yesterday_start <= creado_en < today_start:
                completados_ayer += 1

    inventario_bajo_total = _count_low_inventory(db, None, None)
    inventario_bajo_actual = _count_low_inventory(db, current_window_start, tomorrow_start)
    inventario_bajo_prev = _count_low_inventory(db, previous_window_start, current_window_start)

    usuarios_activos_total = _count_active_users(db)
    usuarios_activos_actuales = _count_active_users(db, current_window_start, tomorrow_start)
    usuarios_activos_previos = _count_active_users(db, previous_window_start, current_window_start)

    return schemas.DashboardStats(
        talleres_activos=schemas.DashboardMetric(
            value=activos_total,
            trend=_calculate_trend(activos_actuales, activos_previos),
        ),
        completados_hoy=schemas.DashboardMetric(
            value=completados_hoy,
            trend=_calculate_trend(completados_hoy, completados_ayer),
        ),
        inventario_bajo=schemas.DashboardMetric(
            value=inventario_bajo_total,
            trend=_calculate_trend(inventario_bajo_actual, inventario_bajo_prev),
        ),
        usuarios_activos=schemas.DashboardMetric(
            value=usuarios_activos_total,
            trend=_calculate_trend(usuarios_activos_actuales, usuarios_activos_previos),
        ),
    )