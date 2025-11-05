from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models.talleres import Taller
from ..models.productos import Producto


async def assert_producto_exists(db: AsyncSession, producto_id: int):
    res = await db.execute(select(Producto).where(Producto.id == producto_id))
    if not res.scalar_one_or_none():
        raise ValueError("Producto no existe")