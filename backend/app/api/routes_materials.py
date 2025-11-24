from fastapi import APIRouter

from app.data.materials import MATERIAL_CATALOG

router = APIRouter()

@router.get("/")
def list_materials();
    "devuelve el catalogo de cortes"
    return MATERIAL_CATALOG