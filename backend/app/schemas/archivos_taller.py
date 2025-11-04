from pydantic import BaseModel


class ArchivoOut(BaseModel):
    id: int
    filename: str
    path: str

    class Config:
        from_attributes = True