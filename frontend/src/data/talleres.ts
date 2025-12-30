export type Especie = "res" | "cerdo";

export interface SubcorteDefinition {
  codigo: string;
  nombre: string;
}

const withUniqueSubcortes = (base: SubcorteDefinition[], nuevos: SubcorteDefinition[]) => {
  const map = new Map<string, SubcorteDefinition>();
  [...base, ...nuevos].forEach((subcorte) => {
    if (!map.has(subcorte.codigo)) {
      map.set(subcorte.codigo, subcorte);
    }
  });
  return Array.from(map.values());
};

export interface MaterialDefinition {
  codigo: string;
  nombre: string;
  especie: Especie;
  subcortes: SubcorteDefinition[];
}

export const TALLER_MATERIALES: MaterialDefinition[] = [
  {
    especie: "res",
    codigo: "57654",
    nombre: "Ampolleta Normal",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5839", nombre: "Molida Esp" },
        { codigo: "22835", nombre: "Gordana" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "5588",
    nombre: "Bola Negra Especial",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "22835", nombre: "Gordana" },
        { codigo: "11018", nombre: "Pulpa" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "7790", nombre: "Bola negra normal" },
        { codigo: "33643", nombre: "Espaldilla" },
        { codigo: "5839", nombre: "Molida Esp" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "25493",
    nombre: "Caderita Especial",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "22835", nombre: "Gordana" },
        { codigo: "7833", nombre: "Caderita Normal" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "11018", nombre: "Pulpa Normal" },
        { codigo: "35508", nombre: "Hueso Promo" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "6415",
    nombre: "Costilla Normal",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "6414", nombre: "Costilla Especial" },
        { codigo: "33642", nombre: "Costilla Light" },
        { codigo: "37508", nombre: "Hueso Promo" },
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "22835", nombre: "Gordana*Kilo" },
        { codigo: "70165", nombre: "Costichi" },
      ],
      [{ codigo: "5815", nombre: "Molida Normal" }]
    ),
  },
  {
    especie: "res",
    codigo: "33643",
    nombre: "Espaldilla especial",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "5834", nombre: "Espaldilla" },
        { codigo: "22835", nombre: "Gordana" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "5834",
    nombre: "Espaldilla",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "22835", nombre: "Gordana" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "21274",
    nombre: "Lomo Caracha",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "22835", nombre: "Gordana" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "26507",
    nombre: "Lomo Redondo",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "22835", nombre: "Gordana" },
        { codigo: "31682", nombre: "Desperdicio" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "11018", nombre: "Pulpa" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "7849",
    nombre: "Morrillo",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "22835", nombre: "Gordana" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "20182",
    nombre: "Muchacho",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "22835", nombre: "Gordana" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "11018",
    nombre: "Pulpa Normal",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "22835", nombre: "Gordana" },
        { codigo: "31682", nombre: "Desperdicio" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "7833", nombre: "Caderita" },
        { codigo: "35508", nombre: "Hueso promo" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "30358",
    nombre: "Punta Anca",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "22835", nombre: "Gordana" },
        { codigo: "7776", nombre: "Ampolleta Normal" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "25990",
    nombre: "Punta Falda",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "22835", nombre: "Gordana" },
        { codigo: "11018", nombre: "Pulpa" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "31682", nombre: "Desperdicio" },
        { codigo: "5834", nombre: "Espaldilla" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "8037",
    nombre: "Sobaco",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "22835", nombre: "Gordana" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "31682", nombre: "Desperdicio" },
        { codigo: "5837", nombre: "Sobrebarriga" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "35139",
    nombre: "Sobrebarriga especial",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "22835", nombre: "Gordana" },
      ],
      [{ codigo: "5815", nombre: "Molida Normal" }]
    ),
  },
  {
    especie: "res",
    codigo: "5837",
    nombre: "Sobrebarriga",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "22835", nombre: "Gordana" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "35139", nombre: "SobreBarriga Especial" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "70389",
    nombre: "Pecho",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "22835", nombre: "Gordana" },
        { codigo: "5834", nombre: "Espaldilla" },
      ],
      [
        { codigo: "33643", nombre: "Espaldilla especial" },
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "7755",
    nombre: "Pepino",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "22835", nombre: "Gordana" },
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "11018", nombre: "Pulpa" },
      ],
      [{ codigo: "31682", nombre: "Desperdicio" }]
    ),
  },
  {
    especie: "res",
    codigo: "25895",
    nombre: "Lomo Viche Especial",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "22835", nombre: "Gordana" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "31682", nombre: "Desperdicio" },
        { codigo: "11018", nombre: "Pulpa" },
      ]
    ),
  },
  {
    especie: "cerdo",
    codigo: "33649",
    nombre: "Brazo",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "22835", nombre: "Gordana" },
        { codigo: "5800", nombre: "Empella" },
        { codigo: "7860", nombre: "Garra" },
      ],
      [
        { codigo: "45978", nombre: "Bondiola" },
        { codigo: "31783", nombre: "Picada" },
        { codigo: "5815", nombre: "Molida" },
      ]
    ),
  },
  {
    especie: "cerdo",
    codigo: "10351",
    nombre: "Costilla",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "70165", nombre: "Costichi" },
        { codigo: "5800", nombre: "Empella" },
        { codigo: "22835", nombre: "Gordana" },
        { codigo: "7860", nombre: "Garra" },
      ],
      [
        { codigo: "7758", nombre: "Costilla Especial" },
        { codigo: "31682", nombre: "Merma" },
        { codigo: "5815", nombre: "Molida" },
      ]
    ),
  },
  {
    especie: "cerdo",
    codigo: "30151",
    nombre: "Lomo",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5800", nombre: "Empella" },
        { codigo: "22835", nombre: "Gordana" },
      ],
      [
        { codigo: "31783", nombre: "Picada" },
        { codigo: "5815", nombre: "Molida" },
      ]
    ),
  },
  {
    especie: "cerdo",
    codigo: "10358",
    nombre: "Pernil",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5800", nombre: "Empella" },
        { codigo: "22835", nombre: "Gordana" },
      ],
      [
        { codigo: "37183", nombre: "Picada" },
        { codigo: "30029", nombre: "Tocino" },
        { codigo: "7860", nombre: "Garra" },
        { codigo: "5815", nombre: "Molida" },
      ]
    ),
  },
  {
    especie: "cerdo",
    codigo: "30029",
    nombre: "Tocineta",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5800", nombre: "Empella" },
        { codigo: "22835", nombre: "Gordana" },
      ],
      [
        { codigo: "31783", nombre: "Picada" },
        { codigo: "10251", nombre: "Garra" },
        { codigo: "5815", nombre: "Molida" },
      ]
    ),
  },
];

export const getMaterialesPorEspecie = (especie: Especie) =>
  TALLER_MATERIALES.filter((material) => material.especie === especie);
