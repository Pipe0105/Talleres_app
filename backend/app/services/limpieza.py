import re
import unicodedata

_TOKEN_C = re.compile(r"\bC\/[A-ZÁÉÍÓÚÑ0-9\-_.]+", flags=re.IGNORECASE)
_TRIM_PUNCT = re.compile(r"^[\s\-_(),;:\[\]]+|[\s\-_(),;:\[\]]+$")

def normalizar_texto(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "")
    s = s.strip()
    s = re.sub(r"\s+", " ", s)
    return s

def limpiar_item(raw: str) -> str:
    s = normalizar_texto(raw.upper())
    s = _TOKEN_C.sub("", s)
    s = re.sub(r"\s+", " ", s).strip()
    s = _TRIM_PUNCT.sub("", s)
    return s
