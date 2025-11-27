import os
import shutil
import uuid

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from .. import crud, models
from ..database import get_db
from ..dependencies import get_current_admin_user
from ..services.etl_precios import leer_y_limpiar_precios
from .. import models
from .. import crud

router = APIRouter(
    prefix="/upload",
    tags=["upload"],
    dependencies=[Depends(get_current_admin_user)],
)
@router.post("/precios")
def cargar_precios(file: UploadFile = File(...), db: Session = Depends(get_db)):
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
