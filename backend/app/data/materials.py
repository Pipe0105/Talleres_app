"""Catálogo estático de cortes de res y cerdo.

Las listas se basan en la referencia visual proporcionada por el usuario.
No se agregan materiales adicionales y se mantienen sin duplicados.
"""

from __future__ import annotations

from typing import Dict, List

def _unique(sequence: List[str]) -> List[str]:
    
    seen = set()
    unique_items: List[str] = []
    for item in sequence:
        if item not in seen:
            unique_items.append(item)
            seen.add(item)
    return unique_items

RES_PRINCIPALES = _unique(
    [
        "AMPOLLETA NORMAL",
        "BOLA NEGRA ESPECIAL",
        "CADERITA ESPECIAL",
        "COSTILLA NORMAL",
        "COSTILLA ESPECIAL",
        "COSTILLA LIGHT",
        "HUESO PROMO",
        "ESPALDILLA PALOMA",
        "LOMO CARACHA",
        "LOMO REDONDO",
        "MORRILLO KILO",
        "MUCHACHO",
        "PULPA NORMAL",
        "PUNTA DE ANCA",
        "AMPOLLETA",
        "PUNTA FALDA",
        "SOBACO",
        "SOBREBARRIGA",
        "PECHO KILO",
        "ESPALDILLA",
        "PEPINO KILO",
        "LOMO VICHE ESPECIAL"
    ]
)

RES_SECUNDARIOS = _unique(
    [
        "33647 RECORTE",
        "22835 GORDANA",
        "1108 PULPA",
        "6415 CADERITA NORMAL",
        "33642 COSTILLA LIGHT",
        "31622 DESPERDICIO",
        "5854 MUCHACHO",
        "5808 PULPA NORMAL"
    ]
)

CERDO_PRINCIPALES =     _unique(
    [
        "BRAZO",
        "COSTILLA",
        "COSTICHI",
        "GARRA",
        "LOMO",
        "PERNIL",
        "TOCINETA",
    ]
)

CERDO_SECUNDARIOS = _unique(
    [
        "33647 RECORTE",
        "5800 EMPELLA",
    ]
)

MATERIAL_CATALOG: Dict[str, Dict[str, List[str]]] = {
    "res": {
        "principales": RES_PRINCIPALES,
        "secundarios": RES_SECUNDARIOS,
    },
    "cerdo": {
        "principales": CERDO_PRINCIPALES,
        "secundarios": CERDO_SECUNDARIOS,
    },
}