import re
import pandas as pd
from typing import Tuple, List, Dict, Optional
from decimal import Decimal, InvalidOperation
from .limpieza import limpiar_item, normalizar_texto

REQUIRED_COLS = ["item", "descripcion", "precio_venta"]
_ESPECIE_COLUMN = "especie"
_ESPECIE_ALIAS = {
    "res": "res",
    "cerdo": "cerdo",
}
_ESPECIE_RES_REGEX = re.compile(r"\b(RES)\b")
_ESPECIE_CERDO_REGEX = re.compile(r"\b(CERDO)\b")

def _normalize_especie(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = normalizar_texto(value).strip().lower()
    if not normalized:
        return None
    return _ESPECIE_ALIAS.get(normalized)

def _infer_especie(descripcion: str) -> Optional[str]:
    descripcion_norm = normalizar_texto(descripcion).upper()
    if _ESPECIE_CERDO_REGEX.search(descripcion_norm):
        return "cerdo"
    if _ESPECIE_RES_REGEX.search(descripcion_norm):
        return "res"
    return None

def leer_y_limpiar_precios(path: str, fuente: str) -> Tuple[pd.DataFrame, List[Dict]]:
    df = pd.read_excel(path, engine="openpyxl")
    cols = {c.lower(): c for c in df.columns}
    if not all(k in cols for k in REQUIRED_COLS):
        raise ValueError(f"Columnas requeridas: {REQUIRED_COLS}")
    df = df.rename(columns={cols["item"]:"item", cols["descripcion"]:"descripcion", cols["precio_venta"]:"precio_venta"})
    df["item_code"] = df["item"].astype(str).map(limpiar_item)
    df["descripcion"] = df["descripcion"].astype(str).map(lambda x: normalizar_texto(x.upper()))
    especie_col = cols.get(_ESPECIE_COLUMN)
    if especie_col:
        df["especie"] = df[especie_col].astype(str).map(_normalize_especie)
    else:
        df["especie"] = None

    rechazados = []
    ok_rows = []
    for _, r in df.iterrows():
        raw_precio = r["precio_venta"]
        try:
            precio = Decimal(str(raw_precio)).quantize(Decimal("0.0001"))
            if precio < 0:
                raise InvalidOperation
            especie = r.get("especie") or _infer_especie(r["descripcion"])
            ok_rows.append(
                {
                    "item_code": r["item_code"],
                    "descripcion": r["descripcion"],
                    "precio_venta": precio,
                    "fuente_archivo": fuente,
                    "especie": especie,
                }
            )
        except Exception:
            rechazados.append({
                "raw_item": r.get("item"),
                "raw_descripcion": r.get("descripcion"),
                "raw_precio": raw_precio,
                "motivo": "precio_venta inválido",
                "fuente_archivo": fuente
            })
    return pd.DataFrame(ok_rows), rechazados
