from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
import shutil, os, uuid
from ..database import get_db
from ..services.etl_precios import leer_y_limpiar_precios
from .. import models
from .. import crud

router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("/precios")
def cargar_precios(file: UploadFile = File(...), db: Session = Depends(lambda: next(get_db()))):
    tmpname = f"/tmp/{uuid.uuid4()}_{file.filename}"
    with open(tmpname, "wb") as f:
        shutil.copyfileobj(file.file, f)
    try:
        df, rechazados = leer_y_limpiar_precios(tmpname, fuente=file.filename)
        objs = crud.upsert_items(db, df.to_dict(orient="records"))
        db.flush()
        for r in rechazados:
            db.add(models.PreciosRechazados(**r))
        return {"insertados_actualizados": len(objs), "rechazados": len(rechazados)}
    finally:
        try: os.remove(tmpname)
        except: pass
