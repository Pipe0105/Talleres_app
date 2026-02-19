import re
import unicodedata


BRANCH_LOCATIONS = [
    "Ciudad Jardin",
    "Calle 5ta",
    "La 39",
    "Centro Sur",
    "Floresta",
    "Plaza Norte",
    "Floralia",
    "Guaduales",
    "Palmira",
    "Bogota",
    "Chia",
    "Planta",
]


def _normalize_sede_key(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value.strip())
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    compact = re.sub(r"[^a-z0-9]+", " ", ascii_text.lower()).strip()
    if compact.startswith("ciudad jard"):
        return "ciudad jardin"
    if compact.startswith("bogot"):
        return "bogota"
    return compact


_BRANCH_LOOKUP = {_normalize_sede_key(sede): sede for sede in BRANCH_LOCATIONS}


def normalize_sede_name(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    if not normalized:
        return None
    return _BRANCH_LOOKUP.get(_normalize_sede_key(normalized))
