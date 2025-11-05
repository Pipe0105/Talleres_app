from pathlib import Path
from fastapi import UploadFile
from ..core.config import settings


class StorageService:
    def __init__(self, base_dir: str | None = None):
        self.base = Path(base_dir or settings.UPLOAD_DIR)
        self.base.mkdir(parents=True, exist_ok=True)


async def save_taller_file(self, taller_id: int, file: UploadFile) -> tuple[str, str]:
    folder = self.base / str(taller_id)
    folder.mkdir(parents=True, exist_ok=True)
    dest = folder / file.filename
    content = await file.read()
    dest.write_bytes(content)
    rel_path = str(dest)
    return file.filename, rel_path


storage_service = StorageService()