import pandas as pd
from typing import Tuple, List, Dict
from decimal import Decimal, InvalidOperation
from .limpieza import limpiar_item, normalizar_texto

REQUIRED_COLS = ["item", "descripcion", "precio_venta"]

def leer_y_limpiar_precios(path: str, fuente: str) -> Tuple[pd.DataFrame, List[Dict]]:
    df = pd.read_excel(path, engine="openpyxl")
    cols = {c.lower(): c for c in df.columns}
    if not all(k in cols for k in REQUIRED_COLS):
        raise ValueError(f"Columnas requeridas: {REQUIRED_COLS}")
    df = df.rename(columns={cols["item"]:"item", cols["descripcion"]:"descripcion", cols["precio_venta"]:"precio_venta"})
    df["item_code"] = df["item"].astype(str).map(limpiar_item)
    df["descripcion"] = df["descripcion"].astype(str).map(lambda x: normalizar_texto(x.upper()))

    rechazados = []
    ok_rows = []
    for _, r in df.iterrows():
        raw_precio = r["precio_venta"]
        try:
            precio = Decimal(str(raw_precio)).quantize(Decimal("0.0001"))
            if precio < 0:
                raise InvalidOperation
            ok_rows.append({"item_code": r["item_code"], "descripcion": r["descripcion"], "precio_venta": precio, "fuente_archivo": fuente})
        except Exception:
            rechazados.append({
                "raw_item": r.get("item"),
                "raw_descripcion": r.get("descripcion"),
                "raw_precio": raw_precio,
                "motivo": "precio_venta inválido",
                "fuente_archivo": fuente
            })
    return pd.DataFrame(ok_rows), rechazados
