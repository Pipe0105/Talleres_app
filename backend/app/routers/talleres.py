from datetime import date, datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_active_user, get_current_manager_user
from ..models import Corte, Item, Taller, TallerDetalle, User

from ..schemas import (
    TallerActividadUsuario,
    TallerCalculoRow,
    TallerCreatePayload,
    TallerListItem,
    TallerOut,
)
router = APIRouter(
    prefix="/talleres",
    tags=["talleres"],
)

@router.post("", response_model=TallerOut)
def crear_taller(
    payload: TallerCreatePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not payload.cortes:
        raise HTTPException(status_code=400, detail="debes incluir al menos un detaller")
    
    peso_inicial = _to_decimal(payload.peso_inicial)
    if peso_inicial is None or peso_inicial <= 0:
        raise HTTPException(status_code=400, detail="el peso inicial debe ser mayor a cero")
    
    peso_final = _to_decimal(payload.peso_final)
    porcentaje_perdida = _to_decimal(payload.porcentaje_perdida)
    
    if peso_final is None or peso_final < 0:
        raise HTTPException(status_code=400, detail="el peso final no puede ser negativo")
    
    if peso_final is not None:
        porcentaje_perdida = (
            (peso_inicial - peso_final) / peso_inicial * 100
            if peso_inicial
            else (0)
        )
    elif porcentaje_perdida is not None and porcentaje_perdida >= 0:
        raise HTTPException(status_code=400, detail="el porcentaje de perdida no puede ser negativo")
    
    taller = Taller(
        nombre_taller=payload.nombre_taller.strip(),
        descripcion=payload.descripcion.strip() if payload.descripcion else None,
        peso_inicial=peso_inicial,
        peso_final=peso_final,
        porcentaje_perdida=porcentaje_perdida,
        creado_por_id=current_user.id,
    )
    if not taller.nombre_taller:
        raise HTTPException(status_code=400, detail="el nombre del taller es obligatorio")
    
    db.add(taller)
    db.flush()
    

    for corte in payload.cortes:
        item = db.get(Item, corte.item_id)
        if not item:
            raise HTTPException(status_code=404, detail=f"item {corte.item_id} no existe")

        corte_encontrado = db.get(Corte, corte.corte_id)
        if not corte_encontrado:
            raise HTTPException(
                status_code=400, detail=f"corte {corte.corte_id} no existe"
            )
            
        if corte_encontrado.item_id != corte.item_id:
            raise HTTPException(
                status_code=400,
                detail="el corte seleccionado no pertenece al item indicado",
            )
            
        db.add(
            TallerDetalle(
                taller_id=taller.id,
                item_id=corte.item_id,
                corte_id=corte.corte_id,
                peso=corte.peso,
            )
        )
    
    db.commit()
    db.refresh(taller)
    
    return TallerOut.model_validate(taller)

@router.get("", response_model=list[TallerListItem])
@router.get("/", response_model=list[TallerListItem])
def listar_talleres(db: Session = Depends(get_db)):
    resultados = (
        db.query(
            Taller.id,
            Taller.nombre_taller,
            Taller.descripcion,
            Taller.peso_inicial,
            Taller.peso_final,
            Taller.porcentaje_perdida,
            func.coalesce(func.sum(TallerDetalle.peso), 0).label("total_peso"),
            func.count(TallerDetalle.id).label("detalles_count"),
        )
        .outerjoin(TallerDetalle, TallerDetalle.taller_id == Taller.id)
        .group_by(Taller.id)
        .order_by(Taller.id.desc())
        .all()
    )
    
    talleres: list[TallerListItem] = []
    for row in resultados:
        total_peso = _to_float(row.total_peso)
        detalles_count = int(row.detalles_count or 0)
        talleres.append(
            TallerListItem(
                id = row.id,
                nombre_taller = row.nombre_taller,
                descripcion = row.descripcion,
                peso_inicial = _to_float(row.peso_inicial) if row.peso_inicial is not None else None,
                peso_final = _to_float(row.peso_final) if row.peso_final is not None else None,
                porcentaje_perdida = _to_float(row.porcentaje_perdida) if row.porcentaje_perdida is not None else None,
                total_peso = total_peso,
                detalles_count= detalles_count,
            )
        )
    return talleres

def _to_float(value: Decimal | float | int | None) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)

def _normalize_range(
    start_date: date | None, end_date: date | None
) -> tuple[date, date]:
    today = date.today()
    normalized_start = start_date or (today - timedelta(days=today.weekday()))
    normalized_end = end_date or (normalized_start + timedelta(days=6))

    if normalized_end < normalized_start:
        normalized_start, normalized_end = normalized_end, normalized_start

    return normalized_start, normalized_end


@router.get("/actividad", response_model=list[TallerActividadUsuario])
def actividad_talleres(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_manager_user),
):
    fecha_inicio, fecha_fin = _normalize_range(start_date, end_date)
    rango_fechas: list[date] = []
    iterador = fecha_inicio
    while iterador <= fecha_fin:
        rango_fechas.append(iterador)
        iterador += timedelta(days=1)

    inicio_dt = datetime.combine(fecha_inicio, datetime.min.time())
    fin_dt = datetime.combine(fecha_fin + timedelta(days=1), datetime.min.time())

    actividad_rows = (
        db.query(
            Taller.creado_por_id.label("user_id"),
            func.date(Taller.creado_en).label("fecha"),
            func.count(Taller.id).label("cantidad"),
        )
        .filter(Taller.creado_en >= inicio_dt, Taller.creado_en < fin_dt)
        .group_by(Taller.creado_por_id, func.date(Taller.creado_en))
        .all()
    )

    actividad_por_usuario: dict[int, dict[date, int]] = {}
    for row in actividad_rows:
        if row.user_id is None:
            continue
        actividad_por_usuario.setdefault(row.user_id, {})[row.fecha] = int(
            row.cantidad or 0
        )

    usuarios = (
        db.query(User)
        .filter(
            User.is_active.is_(True),
            User.sede.isnot(None),
            func.length(func.trim(User.sede)) > 0,
        )
        .order_by(User.username)
        .all()
    )

    resultados: list[TallerActividadUsuario] = []
    for usuario in usuarios:
        dias = [
            {"fecha": fecha, "cantidad": actividad_por_usuario.get(usuario.id, {}).get(fecha, 0)}
            for fecha in rango_fechas
        ]
        resultados.append(
            TallerActividadUsuario(
                user_id=usuario.id,
                username=usuario.username,
                full_name=usuario.full_name,
                sede=usuario.sede,
                is_active=usuario.is_active,
                dias=dias,
            )
        )

    return resultados

@router.get("/{taller_id}/calculo", response_model=list[TallerCalculoRow])
def ver_calculo(taller_id: int, db: Session = Depends(get_db)):
    total_peso_subquery = (
        db.query(
            TallerDetalle.taller_id.label("taller_id"),
            func.sum(TallerDetalle.peso).label("total_peso"),
        )
        .filter(TallerDetalle.taller_id == taller_id)
        .group_by(TallerDetalle.taller_id)
        .subquery()
    )

    rows = (
        db.query(
            TallerDetalle.taller_id,
            Corte.nombre_corte,
            Item.item_code,
            Item.descripcion,
            Item.precio_venta,
            TallerDetalle.peso,
            func.coalesce(Taller.peso_inicial, total_peso_subquery.c.total_peso).label("peso_base"),
            Corte.porcentaje_default,
        )
        .join(Corte, TallerDetalle.corte_id == Corte.id)
        .join(Item, TallerDetalle.item_id == Item.id)
        .join(Taller, Taller.id == TallerDetalle.taller_id)
        .join(
            total_peso_subquery,
            total_peso_subquery.c.taller_id == TallerDetalle.taller_id,
        )
        .filter(TallerDetalle.taller_id == taller_id)
        .order_by(Corte.nombre_corte)
        .all()
    )
    if not rows:
        raise HTTPException(status_code=404, detail="taller no encontrado o sin detalles")
    resultados: list[dict] = []
    for row in rows:
        peso = _to_float(row.peso)
        peso_total = _to_float(row.peso_base)
        porcentaje_default = _to_float(row.porcentaje_default)
        precio = _to_float(row.precio_venta)
        porcentaje_real = (peso / peso_total * 100) if peso_total else 0.0
        delta_pct = porcentaje_real - porcentaje_default
        valor_estimado = precio * peso
        resultados.append(
            {
                "taller_id": row.taller_id,
                "nombre_corte": row.nombre_corte,
                "item_code": row.item_code,
                "descripcion": row.descripcion,
                "precio_venta": precio,
                "peso": peso,
                "peso_total": peso_total,
                "porcentaje_default": porcentaje_default,
                "porcentaje_real": porcentaje_real,
                "delta_pct": delta_pct,
                "valor_estimado": valor_estimado,
            }
        )
        
    return resultados

def _to_decimal(value: Decimal | float | int | None) -> Decimal | None:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))

