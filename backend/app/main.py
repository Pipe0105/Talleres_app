from fastapi import FastAPI
from .db import engine, Base
from .api.routes_productos import router as productos_router
from .api.routes_talleres import router as talleres_router
from .api.routes_archivos import router as archivos_router
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .models.productos import Producto
from .core.config import settings
import json
from pathlib import Path


app = FastAPI(title="talleres_app API")


@app.on_event("startup")
async def on_startup():
    # Crear tablas
    async with engine.begin() as conn:
    await conn.run_sync(Base.metadata.create_all)


# Seed de productos si está vacío (solo en ENV local)
if settings.ENV == "local":

    from .db import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Producto))
    if not res.scalars().first():
        seed_path = Path(__file__).resolve().parents[1] / "app" / "data" / "productos_seed.json"
    if seed_path.exists():
        items = json.loads(seed_path.read_text(encoding="utf-8"))
    for it in items:
        db.add(Producto(**it))
    await db.commit()


app.include_router(productos_router)
app.include_router(talleres_router)
app.include_router(archivos_router)