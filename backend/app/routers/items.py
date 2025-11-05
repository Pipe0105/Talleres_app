from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Item
from ..schemas import ItemOut

router = APIRouter(prefix="/items", tags=["items"])

@router.get("/", response_model=list[ItemOut])
def listar_items(db: Session = Depends(lambda: next(get_db()))):
    return db.query(Item).order_by(Item.item_code).all()
