from sqlalchemy import Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from ..db import Base


class ArchivoTaller(Base):
    __tablename__ = "archivos_taller"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    taller_id: Mapped[int] = mapped_column(ForeignKey("talleres.id", ondelete="CASCADE"))
    filename: Mapped[str] = mapped_column(String(255))
    path: Mapped[str] = mapped_column(String(512))
    subido_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

taller = relationship("Taller", back_populates="archivos")