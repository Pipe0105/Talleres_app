from datetime import date, datetime
from typing import Annotated, Optional
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, EmailStr, condecimal, field_validator

MAX_CODE_LENGTH = 120
MAX_NAME_LENGTH = 120
MAX_DESCRIPTION_LENGTH = 2000
MAX_PASSWORD_LENGTH = 128
MIN_PASSWORD_LENGTH = 8


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

class ItemIn(BaseModel):
    item_code: str
    descripcion: str
    precio_venta: condecimal(ge=0, max_digits=14, decimal_places=4)  # type: ignore

    model_config = ConfigDict(extra="forbid")

    @field_validator("item_code")
    @classmethod
    def _validate_item_code(cls, value: str) -> str:
        return _validate_printable_text(value, "El código del ítem", MAX_CODE_LENGTH)

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


class DashboardMetric(BaseModel):
    value: int
    trend: float | None = None


class DashboardStats(BaseModel):
    talleres_activos: DashboardMetric
    completados_hoy: DashboardMetric
    inventario_bajo: DashboardMetric
    usuarios_activos: DashboardMetric


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
    hashed_password: str
    plain_password: Optional[str] = None

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
    
class ItemsPageOut(BaseModel):
    items: list[ListaPreciosOut]
    total: int
    page: int
    page_size: int


class TallerDetalleCreate(BaseModel):
    codigo_producto: str
    nombre_subcorte: str
    peso: Annotated[
    Decimal,
    condecimal(ge=0, max_digits=14, decimal_places=4)
]
    item_id: Optional[int] = None
    
    model_config = ConfigDict(extra="forbid")

    @field_validator("codigo_producto")
    @classmethod
    def _validate_codigo_producto(cls, value: str) -> str:
        return _validate_printable_text(value, "El código del producto", MAX_CODE_LENGTH)

    @field_validator("nombre_subcorte")
    @classmethod
    def _validate_nombre_subcorte(cls, value: str) -> str:
        return _validate_printable_text(value, "El nombre del subcorte", MAX_NAME_LENGTH)

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
        return _validate_printable_text(value, "El código principal", MAX_CODE_LENGTH)

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
    
class TallerUpdate(TallerCreate):
    """Payload para actualizar un taller existente."""
    
class TallerGrupoCreate(BaseModel):
    nombre_taller: str
    descripcion: Optional[str] = None
    sede: Optional[str] = None
    especie: Optional[str] = None
    materiales: list[TallerCreate]

    model_config = ConfigDict(extra="forbid")

    @field_validator("nombre_taller")
    @classmethod
    def _validate_nombre_taller(cls, value: str) -> str:
        return _validate_printable_text(value, "El nombre del taller", MAX_NAME_LENGTH)

    @field_validator("descripcion")
    @classmethod
    def _validate_descripcion(cls, value: Optional[str]) -> Optional[str]:
        return _validate_optional_text(value, "La descripción", MAX_DESCRIPTION_LENGTH)

    @field_validator("especie")
    @classmethod
    def _validate_especie(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

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


class TallerDetalleOut(BaseModel):
    id: int
    codigo_producto: str
    nombre_subcorte: str
    peso: Decimal
    item_id: Optional[int] = None

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
    nombre_principal: Optional[str] = None
    taller_grupo_id: Optional[int] = None
    creado_en: datetime
    subcortes: list[TallerDetalleOut]

    model_config = ConfigDict(from_attributes=True)
    
    
class TallerWithCreatorOut(TallerOut):
    creado_por: str | None = None
    

class TallerGrupoOut(BaseModel):
    id: int
    nombre_taller: str
    descripcion: Optional[str]
    sede: Optional[str]
    especie: Optional[str]
    creado_en: datetime
    materiales: list[TallerOut]

    model_config = ConfigDict(from_attributes=True)


class TallerGrupoListItem(BaseModel):
    id: int
    nombre_taller: str
    descripcion: Optional[str] = None
    sede: Optional[str] = None
    especie: Optional[str] = None
    creado_en: datetime
    total_materiales: int

    model_config = ConfigDict(from_attributes=True)
    
    
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
    porcentaje_perdida: Optional[Decimal] = None
    total_peso: Decimal
    especie: str
    codigo_principal: Optional[str] = None
    taller_grupo_id: Optional[int] = None
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