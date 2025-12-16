from __future__ import annotations
import re
from typing import List, Sequence

from sqlalchemy.orm import Session

from ..models import Corte, Item


DEFAULT_CORTES_BY_CODE: dict[str, Sequence[str]] = {
    # Res
    "C/RES AMPOLLETA NORMAL": ["Recorte", "Gordana", "Ampolleta Normal"],
    "C/RES BOLA NEGRA ESPEC": ["Recorte", "Gordana"],
    "C/RES ESPALDILLA/PALOMILLA": ["Recorte", "Gordana", "Espadilla/Paloma"],
    "C/RES LOMO CARACHA MAGRA": ["Recorte", "Gordana"],
    "C/RES LOMO REDONDO ESPEC": ["Recorte", "Gordana"],
    "C/RES MORRILLO": ["Recorte", "Gordana"],
    "C/RES MUCHACHO ESPEC": ["Recorte", "Gordana"],
    "C/RES PECHO": ["Recorte", "Gordana"],
    "C/RES PEPINO ESPEC": ["Recorte", "Gordana"],
    "C/RES PULPA NORMAL": ["Recorte", "Gordana", "Pulpa"],
    "C/RES PUNTA ANCA ESPECIAL": ["Recorte", "Gordana"],
    "C/RES PUNTA FALDA ESPEC": ["Recorte", "Gordana"],
    "C/RES SOBACO": ["Recorte", "Gordana"],
    "C/RES SOBREBARRIGA ESPEC": ["Recorte", "Gordana"],
    "7776": ["Recorte", "Gordana"],
    "5585": ["Recorte", "Gordana", "Pulpa"],
    "25493": ["Recorte", "Gordana", "Caderita Normal"],
    "6415": ["Recorte", "Gordana", "Costilla Especial", "Costilla Light", "Hueso Promo"],
    "5834": ["Recorte", "Gordana"],
    "5856": ["Recorte", "Gordana"],
    "5871": ["Recorte", "Gordana", "Desperdicio"],
    "7843": ["Recorte", "Gordana"],
    "5854": ["Recorte 5843", "Gordana"],
    "11018": ["Recorte", "Gordana", "Desperdicio"],
    "7767": ["Recorte", "Gordana", "Ampolleta Normal"],
    "7768": ["Recorte", "Gordana", "Pulpa"],
    "8037": ["Recorte", "Gordana"],
    "5837": ["Recorte", "Gordana"],
    "5844": ["Recorte", "Gordana", "Espadilla/Paloma"],
    "8005": ["Recorte", "Gordana", "Pulpa"],
    "5848": ["Recorte", "Gordana"],
    # Cerdo
    "9324": ["Recorte", "Empella"],
    "10251": ["Costichi", "Empella", "Garra"],
    "5810": ["Recorte", "Empella"],
    "35164": ["Recorte", "Empella"],
    "5828": ["Recorte", "Empella"],
}


def normalize_code(value: str | None) -> str:
    return (value or "").strip().upper()

def resolve_item_code(item: Item) -> str:
    """Return a code that can be used to fetch default cortes for an item."""

    def match_known_code(candidate: str) -> str:
        if not candidate:
            return ""

        normalized = normalize_code(candidate)
        if normalized in DEFAULT_CORTES_BY_CODE:
            return normalized

        for code in DEFAULT_CORTES_BY_CODE:
            if normalized.startswith(code):
                return code

        match = re.search(r"\d+", normalized)
        return match.group(0) if match else ""

    for source in (item.item_code, item.nombre, item.descripcion):
        resolved = match_known_code(source or "")
        if resolved:
            return resolved

    return ""

def ensure_default_cortes(db: Session, item: Item) -> List[Corte]:
    code = resolve_item_code(item)
    defaults = DEFAULT_CORTES_BY_CODE.get(code)
    if not defaults:
        return []

    created: List[Corte] = []
    for nombre_corte in defaults:
        corte = Corte(
            item_id=item.id,
            nombre_corte=nombre_corte,
            porcentaje_default=0,
        )
        db.add(corte)
        created.append(corte)

    db.commit()
    for corte in created:
        db.refresh(corte)

    return created


def get_default_cortes(db: Session, item: Item) -> List[Corte]:
    """
    Return cortes configured for the item, creating defaults when none exist.
    """

    cortes: List[Corte] = (
        db.query(Corte)
        .filter(Corte.item_id == item.id)
        .order_by(Corte.nombre_corte)
        .all()
    )
    if cortes:
        return cortes

    return ensure_default_cortes(db, item)