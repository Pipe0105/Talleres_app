from sqlalchemy.orm import Session
from . import models

def upsert_items(db: Session, rows):
    out = []
    for row in rows:
        obj = db.query(models.Item).filter(models.Item.item_code == row["item_code"]).one_or_none()
        if obj:
            obj.descripcion = row["descripcion"]
            obj.precio_venta = row["precio_venta"]
            obj.fuente_archivo = row["fuente_archivo"]
        else:
            obj = models.Item(**row)
            db.add(obj)
        out.append(obj)
    return out
