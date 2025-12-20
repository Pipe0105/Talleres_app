from datetime import date, datetime
from typing import Annotated, Optional
from decimal import Decimal
import re

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    condecimal,
    field_validator,
    model_validator,
)


MAX_CODE_LENGTH = 120
MAX_NAME_LENGTH = 120
MAX_DESCRIPTION_LENGTH = 2000
MAX_PASSWORD_LENGTH = 128
MIN_PASSWORD_LENGTH = 8
SKU_PATTERN = re.compile(r"^[A-Z0-9][A-Z0-9_.-]*$", re.IGNORECASE)
ALLOWED_CATEGORIES = {"corte", "subproducto", "merma", "otro"}
UNIT_MULTIPLIERS: dict[str, Decimal] = {
    "kg": Decimal("1"),
    "g": Decimal("0.001"),
    "lb": Decimal("0.45359237"),
}
UNITS_REQUIRING_FACTOR = {"caja", "unidad"}


def _validate_printable_text(value: str, field_name: str, max_length: int) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError(f"{field_name} es obligatorio")
    if len(normalized) > max_length:
        raise ValueError(f"{field_name} supera el máximo permitido")
    if not normalized.isprintable():
        raise ValueError(f"{field_name} contiene caracteres no válidos")
    return normalized


def _validate_optional_text(value: Optional[str], field_name: str, max_length: int) -> Optional[str]:
    if value is None:
        return None
    normalized = value.strip()
    if not normalized:
        return None
    if len(normalized) > max_length:
        raise ValueError(f"{field_name} supera el máximo permitido")
    if not normalized.isprintable():
        raise ValueError(f"{field_name} contiene caracteres no válidos")
    return normalized


def _validate_password_strength(value: str) -> str:
    if len(value) < MIN_PASSWORD_LENGTH:
        raise ValueError("La contraseña es demasiado corta")
    if len(value) > MAX_PASSWORD_LENGTH:
        raise ValueError("La contraseña supera el máximo permitido")
    if any(ch.isspace() for ch in value):
        raise ValueError("La contraseña no debe contener espacios")
    if not any(ch.islower() for ch in value):
        raise ValueError("La contraseña debe incluir minúsculas")
    if not any(ch.isupper() for ch in value):
        raise ValueError("La contraseña debe incluir mayúsculas")
    if not any(ch.isdigit() for ch in value):
        raise ValueError("La contraseña debe incluir números")
    return value

def _validate_sku(value: str, field_name: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError(f"{field_name} es obligatorio")
    if len(normalized) > MAX_CODE_LENGTH:
        raise ValueError(f"{field_name} supera el máximo permitido")
    if not SKU_PATTERN.fullmatch(normalized):
        raise ValueError(
            f"{field_name} debe usar solo letras, números, guiones o guiones bajos"
        )
    return normalized.upper()

def _validate_category(value: str) -> str:
    normalized = value.strip().lower()
    if not normalized:
        raise ValueError("La categoría es obligatoria")
    if normalized not in ALLOWED_CATEGORIES:
        raise ValueError(
            f"La categoría no es válida. Usa una de: {', '.join(sorted(ALLOWED_CATEGORIES))}."
        )
    return normalized

def resolve_conversion_factor(unidad_medida: str, factor: Optional[Decimal]) -> Decimal:
    unidad = unidad_medida.strip().lower()
    if unidad in UNIT_MULTIPLIERS:
        return UNIT_MULTIPLIERS[unidad]

    if unidad in UNITS_REQUIRING_FACTOR:
        if factor is None:
            raise ValueError(
                "Debes indicar cuántos kg representa cada unidad/paquete para normalizar el stock."
            )
        if factor <= 0:
            raise ValueError("El factor de conversión debe ser mayor que cero.")
        return factor

    raise ValueError("La unidad de medida no es válida.")

def normalize_to_base_quantity(
    cantidad: Decimal, unidad_medida: str, factor_conversion: Optional[Decimal]
) -> Decimal:
    factor = resolve_conversion_factor(unidad_medida, factor_conversion)
    return (cantidad * factor).quantize(Decimal("0.0001"))


class ItemIn(BaseModel):
    item_code: str
    descripcion: str
    precio_venta: condecimal(ge=0, max_digits=14, decimal_places=4)  # type: ignore

    model_config = ConfigDict(extra="forbid")

    @field_validator("item_code")
    @classmethod
    def _validate_item_code(cls, value: str) -> str:
        return _validate_sku(value, "El código del ítem")

    @field_validator("descripcion")
    @classmethod
    def _validate_descripcion(cls, value: str) -> str:
        return _validate_printable_text(value, "La descripción", MAX_DESCRIPTION_LENGTH)

class ItemOut(BaseModel):
    id: int
    item_code: str
    descripcion: str
    precio_venta: Optional[float] = None
    actualizado_en: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    
    sede: Optional[str] = None
    
    model_config = ConfigDict(extra="forbid")
    
    @field_validator("username")
    @classmethod
    def _validate_username(cls, value: str) -> str:
        return _validate_printable_text(value, "El nombre de usuario", MAX_NAME_LENGTH)

    @field_validator("full_name")
    @classmethod
    def _validate_full_name(cls, value: Optional[str]) -> Optional[str]:
        return _validate_optional_text(value, "El nombre completo", MAX_NAME_LENGTH)

    @field_validator("sede")
    @classmethod
    def _validate_sede(cls, value: Optional[str]) -> Optional[str]:
        from .constants import BRANCH_LOCATIONS

        if value is None:
            return value

        normalized = value.strip()
        if not normalized:
            return None

        if normalized not in BRANCH_LOCATIONS:
            raise ValueError("La sede no es válida. Usa una de las sedes configuradas.")

        return normalized


class UserCreate(UserBase):
    password: str
    
    @field_validator("password")
    @classmethod
    def _validate_password(cls, value: str) -> str:
        return _validate_password_strength(value)


class UserOut(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    is_gerente: bool
    creado_en: datetime
    actualizado_en: datetime
    model_config = ConfigDict(from_attributes=True)
    
class AdminUserOut(UserOut):

    model_config = ConfigDict(from_attributes=True)




class UserLogin(BaseModel):
    username: str
    password: str
    
    model_config = ConfigDict(extra="forbid")

    @field_validator("username")
    @classmethod
    def _validate_username(cls, value: str) -> str:
        return _validate_printable_text(value, "El nombre de usuario", MAX_NAME_LENGTH)

    @field_validator("password")
    @classmethod
    def _validate_password(cls, value: str) -> str:
        if not value:
            raise ValueError("La contraseña es obligatoria")
        if len(value) > MAX_PASSWORD_LENGTH:
            raise ValueError("La contraseña supera el máximo permitido")
        return value



class UserAdminCreate(UserCreate):
    is_active: bool = True
    is_admin: bool = False
    is_gerente: bool = False


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    is_gerente: Optional[bool] = None
    sede: Optional[str] = None
    
    model_config = ConfigDict(extra="forbid")

    @field_validator("username")
    @classmethod
    def _validate_username(cls, value: Optional[str]) -> Optional[str]:
        return _validate_optional_text(value, "El nombre de usuario", MAX_NAME_LENGTH)

    @field_validator("full_name")
    @classmethod
    def _validate_full_name(cls, value: Optional[str]) -> Optional[str]:
        return _validate_optional_text(value, "El nombre completo", MAX_NAME_LENGTH)

    @field_validator("password")
    @classmethod
    def _validate_password(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return _validate_password_strength(value)

    @field_validator("sede")
    @classmethod
    def _validate_sede(cls, value: Optional[str]) -> Optional[str]:
        from .constants import BRANCH_LOCATIONS

        if value is None:
            return value

        normalized = value.strip()
        if not normalized:
            return None

        if normalized not in BRANCH_LOCATIONS:
            raise ValueError("La sede no es válida. Usa una de las sedes configuradas.")

        return normalized


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: int
    exp: Optional[int] = None
    model_config = ConfigDict(extra="ignore")
    
    
class ListaPreciosOut(BaseModel):
    id: int
    codigo_producto: str
    lista_id: int | None = None
    referencia: str | None = None
    location: str | None = None
    sede: str | None = None
    descripcion: str
    precio: float | None
    especie: str | None
    fecha_vigencia: date | None
    fecha_activacion: date | None = None
    unidad: str | None = None
    fuente: str | None
    file_hash: str | None = None
    ingested_at: datetime | None = None
    activo: bool | None
    
    model_config = ConfigDict(from_attributes=True)


class TallerDetalleCreate(BaseModel):
    codigo_producto: str
    nombre_subcorte: str
    peso: Annotated[
    Decimal,
    condecimal(ge=0, max_digits=14, decimal_places=4)
]
    item_id: Optional[int] = None
    categoria: str
    unidad_medida: str = "kg"
    factor_conversion: Optional[Decimal] = None
    
    model_config = ConfigDict(extra="forbid")

    @field_validator("codigo_producto")
    @classmethod
    def _validate_codigo_producto(cls, value: str) -> str:
        return _validate_sku(value, "El código del producto")

    @field_validator("nombre_subcorte")
    @classmethod
    def _validate_nombre_subcorte(cls, value: str) -> str:
        return _validate_printable_text(value, "El nombre del subcorte", MAX_NAME_LENGTH)
    @field_validator("categoria")
    @classmethod
    def _validate_categoria(cls, value: str) -> str:
        return _validate_category(value)

    @field_validator("unidad_medida")
    @classmethod
    def _validate_unidad_medida(cls, value: str) -> str:
        unidad = value.strip().lower()
        if unidad in UNIT_MULTIPLIERS or unidad in UNITS_REQUIRING_FACTOR:
            return unidad
        raise ValueError(
            "La unidad de medida no es válida. Usa kg, g, lb, unidad o caja."
        )

    @field_validator("factor_conversion")
    @classmethod
    def _validate_factor_conversion(
        cls, value: Optional[Decimal], values: dict[str, object]
    ) -> Optional[Decimal]:
        unidad = (values.get("unidad_medida") or "").strip().lower()
        if unidad in UNITS_REQUIRING_FACTOR:
            if value is None:
                raise ValueError(
                    "Indica cuánto equivale cada unidad/paquete para normalizar el stock."
                )
            if value <= 0:
                raise ValueError("El factor de conversión debe ser mayor que cero.")
        elif value is not None and value <= 0:
            raise ValueError("El factor de conversión debe ser mayor que cero.")
        return value

    @model_validator(mode="after")
    def _default_factor(self) -> "TallerDetalleCreate":
        if self.factor_conversion is None and self.unidad_medida in UNIT_MULTIPLIERS:
            self.factor_conversion = UNIT_MULTIPLIERS[self.unidad_medida]
        return self



class TallerCreate(BaseModel):
    nombre_taller: str
    descripcion: Optional[str] = None
    sede: Optional[str] = None
    peso_inicial: Annotated[
    Decimal,
    condecimal(ge=0, max_digits=14, decimal_places=4)
]

    peso_final: Annotated[
    Decimal,
    condecimal(ge=0, max_digits=14, decimal_places=4)
]
    especie: str
    item_principal_id: Optional[int] = None
    codigo_principal: str
    subcortes: list[TallerDetalleCreate]
    
    model_config = ConfigDict(extra="forbid")

    @field_validator("nombre_taller")
    @classmethod
    def _validate_nombre_taller(cls, value: str) -> str:
        return _validate_printable_text(value, "El nombre del taller", MAX_NAME_LENGTH)

    @field_validator("descripcion")
    @classmethod
    def _validate_descripcion(cls, value: Optional[str]) -> Optional[str]:
        return _validate_optional_text(value, "La descripción", MAX_DESCRIPTION_LENGTH)

    @field_validator("codigo_principal")
    @classmethod
    def _validate_codigo_principal(cls, value: str) -> str:
        return _validate_sku(value, "El código principal")

    @field_validator("especie")
    @classmethod
    def _validate_especie(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"res", "cerdo"}:
            raise ValueError("La especie debe ser 'res' o 'cerdo'.")
        return normalized
    
    @field_validator("sede")
    @classmethod
    def _validate_sede(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        from .constants import BRANCH_LOCATIONS

        normalized = value.strip()
        if not normalized:
            return None

        if normalized not in BRANCH_LOCATIONS:
            raise ValueError("La sede no es válida. Usa una de las sedes configuradas.")

        return normalized
    
    @model_validator(mode="after")
    def _validate_subcortes(self) -> "TallerCreate":
        if not self.subcortes:
            raise ValueError("Debes registrar al menos un subcorte.")

        codigos = [detalle.codigo_producto for detalle in self.subcortes]
        if len(codigos) != len(set(codigos)):
            raise ValueError("Los SKU de los subcortes deben ser únicos.")

        if self.codigo_principal in codigos:
            raise ValueError(
                "El SKU principal no puede repetirse dentro de los subcortes."
            )
        return self
    
class TallerUpdate(TallerCreate):
    """Payload para actualizar un taller existente."""

class TallerDetalleOut(BaseModel):
    id: int
    codigo_producto: str
    nombre_subcorte: str
    peso: Decimal
    item_id: Optional[int] = None
    categoria: str
    unidad_medida: str
    factor_conversion: Decimal | None = None
    peso_normalizado: Decimal

    model_config = ConfigDict(from_attributes=True)


class TallerOut(BaseModel):
    id: int
    nombre_taller: str
    descripcion: Optional[str]
    sede: Optional[str]
    peso_inicial: Decimal
    peso_final: Decimal
    porcentaje_perdida: Decimal | None
    especie: str
    codigo_principal: str
    item_principal_id: Optional[int] = None
    creado_en: datetime
    subcortes: list[TallerDetalleOut]

    model_config = ConfigDict(from_attributes=True)
    
    
class TallerWithCreatorOut(TallerOut):
    creado_por: str | None = None
    
class TallerActividadDia(BaseModel):
    fecha: date
    cantidad: int
    
class TallerActividadUsuarioOut(BaseModel):
    user_id: int
    username: str
    full_name: Optional[str] = None
    sede: Optional[str] = None
    dias: list[TallerActividadDia]
    
class TallerListItem(BaseModel):
    id: int
    nombre_taller: str
    descripcion: Optional[str] = None
    sede: Optional[str] = None
    peso_inicial: Decimal
    peso_final: Decimal
    total_peso: Decimal
    especie: str
    codigo_principal: Optional[str] = None
    creado_en: datetime
    
    model_config = ConfigDict(from_attributes=True)
    
class TallerCalculoRow(BaseModel):
    nombre_corte: str
    descripcion: str
    item_code: str
    peso: Decimal
    porcentaje_real: Decimal
    porcentaje_default: Decimal
    delta_pct: Decimal
    precio_venta: Decimal
    valor_estimado: Decimal
    
    model_config = ConfigDict(from_attributes=True)
    
    
class InventarioItem(BaseModel):
    codigo_producto: str
    descripcion: str
    total_peso: Decimal
    sede: str | None = None
    especie: str | None = None
    
    model_config = ConfigDict(from_attributes=True)