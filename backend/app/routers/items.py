from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Item
from ..schemas import ItemOut
from ..dependencies import get_current_active_user


router = APIRouter(
    prefix="/items",
    tags=["items"],
    dependencies=[Depends(get_current_active_user)],
)

@router.get("/", response_model=list[ItemOut])
def listar_items(db: Session = Depends(get_db)):
    return db.query(Item).order_by(Item.item_code).all()
