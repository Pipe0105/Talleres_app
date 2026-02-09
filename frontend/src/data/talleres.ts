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
    codigo: "73617",
    nombre: "C/RES AMPOLLETA NORMAL PP",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5839", nombre: "Molida Esp" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
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
    codigo: "73618",
    nombre: "C/RES BOLA NEGRA NORMAL PP",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
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
    codigo: "73619",
    nombre: "C/RES CADERITA NORMAL PP",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "25949", nombre: "Caderita Especial" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "5839", nombre: "Molida Esp" },
        { codigo: "11018", nombre: "Pulpa Normal" },
        { codigo: "35508", nombre: "Hueso Promo" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "73620",
    nombre: "C/RES COSTILLA NORMAL PP",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "6414", nombre: "Costilla Especial" },
        { codigo: "33642", nombre: "Costilla Light" },
        { codigo: "37508", nombre: "Hueso Promo" },
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "31682", nombre: "Desperdicio" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "70165", nombre: "Costichi" },
      ],
      [{ codigo: "5815", nombre: "Molida Normal" }]
    ),
  },
  {
    especie: "res",
    codigo: "73621",
    nombre: "C/RES ESPALDILLA PP",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "33643", nombre: "Espaldilla Especial" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "73622",
    nombre: "C/RES LOMO CARACHA PP",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "5856", nombre: "Lomo Caracha" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "73623",
    nombre: "C/RES LOMO REDONDO PP",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "31682", nombre: "Desperdicio" },
        { codigo: "5811", nombre: "Lomo Redondo" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "5839", nombre: "Molida Esp" },
        { codigo: "11018", nombre: "Pulpa" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "73624",
    nombre: "C/RES MORRILLO PP",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "7849", nombre: "Morrillo*Kilo" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "5839", nombre: "Molida Esp" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "73625",
    nombre: "C/RES MUCHACHO PP",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "73628",
    nombre: "C/RES PULPA NORMAL PP",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "31682", nombre: "Desperdicio" },
        { codigo: "11018", nombre: "Pulpa Normal" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "5839", nombre: "Molida Esp" },
        { codigo: "7833", nombre: "Caderita" },
        { codigo: "35508", nombre: "Hueso promo" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "73629",
    nombre: "C/RES PUNTA ANCA PP",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "7776", nombre: "Ampolleta Normal" },
        { codigo: "7767", nombre: "Punta Anca" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "73630",
    nombre: "C/RES PUNTA FALDA PP",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "11018", nombre: "Pulpa" },
        { codigo: "7768", nombre: "Punta Falda" },
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
    codigo: "73631",
    nombre: "C/RES SOBACO PP",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "8037", nombre: "Sobaco*Kilo" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "31682", nombre: "Desperdicio" },
        { codigo: "35139", nombre: "Sobrebarriga especial" },
        { codigo: "5837", nombre: "Sobrebarriga" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "73632",
    nombre: "C/RES SOBREBARRIGA PP",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "5837", nombre: "Sobrebarriga" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "35139", nombre: "SobreBarriga Especial" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "73626",
    nombre: "C/RES PECHO PP",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "5834", nombre: "Espaldilla" },
        { codigo: "5844", nombre: "Pecho*Kilo" },
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
    codigo: "73627",
    nombre: "C/RES PEPINO PP",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "11018", nombre: "Pulpa" },
        { codigo: "5806", nombre: "Pepino*Kilo" },
      ],
      [{ codigo: "31682", nombre: "Desperdicio" }]
    ),
  },
  {
    especie: "res",
    codigo: "73633",
    nombre: "C/RES LOMO VICHE PP",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "5848", nombre: "Lomo Viche Especial" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "31682", nombre: "Desperdicio" },
        { codigo: "11018", nombre: "Pulpa" },
        { codigo: "5839", nombre: "Molida Esp" },
      ]
    ),
  },
  {
    especie: "cerdo",
    codigo: "73612",
    nombre: "C/CERDO BRAZO PP",
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
        { codigo: "10358", nombre: "Pernil" },
      ]
    ),
  },
  {
    especie: "cerdo",
    codigo: "73613",
    nombre: "C/CERDO COSTILLA PP",
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
    codigo: "73614",
    nombre: "C/CERDO LOMO PP",
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
    codigo: "73615",
    nombre: "C/CERDO PERNIL PP",
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
    codigo: "73616",
    nombre: "C/CERDO TOCINETA PP",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5800", nombre: "Empella" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
      ],
      [
        { codigo: "31783", nombre: "Picada" },
        { codigo: "10251", nombre: "Garra" },
        { codigo: "5815", nombre: "Molida" },
        { codigo: "10358", nombre: "Pernil" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "57654",
    nombre: "C/RES AMPOLLETA NORMAL",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5839", nombre: "Molida Esp" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
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
    nombre: "C/RES BOLA NEGRA NORMAL",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
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
    codigo: "7833",
    nombre: "C/RES CADERITA NORMAL",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "25949", nombre: "Caderita Especial" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "5839", nombre: "Molida Esp" },
        { codigo: "11018", nombre: "Pulpa Normal" },
        { codigo: "35508", nombre: "Hueso Promo" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "6415",
    nombre: "C/RES COSTILLA NORMAL",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "6414", nombre: "Costilla Especial" },
        { codigo: "33642", nombre: "Costilla Light" },
        { codigo: "37508", nombre: "Hueso Promo" },
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "31682", nombre: "Desperdicio" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "70165", nombre: "Costichi" },
      ],
      [{ codigo: "5815", nombre: "Molida Normal" }]
    ),
  },
  {
    especie: "res",
    codigo: "5834",
    nombre: "C/RES ESPALDILLA",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
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
    nombre: "C/RES LOMO CARACHA",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
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
    nombre: "C/RES LOMO REDONDO",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "31682", nombre: "Desperdicio" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "5839", nombre: "Molida Esp" },
        { codigo: "11018", nombre: "Pulpa" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "7849",
    nombre: "C/RES MORRILLO",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "5839", nombre: "Molida Esp" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "20182",
    nombre: "C/RES MUCHACHO",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
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
    nombre: "C/RES PULPA NORMAL",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "31682", nombre: "Desperdicio" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "5839", nombre: "Molida Esp" },
        { codigo: "7833", nombre: "Caderita" },
        { codigo: "35508", nombre: "Hueso promo" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "30358",
    nombre: "C/RES PUNTA ANCA",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
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
    nombre: "C/RES PUNTA FALDA",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
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
    nombre: "C/RES SOBACO",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "31682", nombre: "Desperdicio" },
        { codigo: "35139", nombre: "Sobrebarriga especial" },
        { codigo: "5837", nombre: "Sobrebarriga" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "5837",
    nombre: "C/RES SOBREBARRIGA",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "35139", nombre: "SobreBarriga Especial" },
        { codigo: "31682", nombre: "Desperdicio" },
      ]
    ),
  },
  {
    especie: "res",
    codigo: "70389",
    nombre: "C/RES PECHO",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
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
    nombre: "C/RES PEPINO",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "11018", nombre: "Pulpa" },
      ],
      [{ codigo: "31682", nombre: "Desperdicio" }]
    ),
  },
  {
    especie: "res",
    codigo: "25895",
    nombre: "C/RES LOMO VICHE",
    subcortes: withUniqueSubcortes(
      [
        { codigo: "33647", nombre: "Recorte" },
        { codigo: "5849", nombre: "Gordana*Kilo" },
      ],
      [
        { codigo: "5815", nombre: "Molida Normal" },
        { codigo: "31682", nombre: "Desperdicio" },
        { codigo: "11018", nombre: "Pulpa" },
        { codigo: "5839", nombre: "Molida Esp" },
      ]
    ),
  },
  {
    especie: "cerdo",
    codigo: "33649",
    nombre: "C/CERDO BRAZO",
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
        { codigo: "10358", nombre: "Pernil" },
      ]
    ),
  },
  {
    especie: "cerdo",
    codigo: "10351",
    nombre: "C/CERDO COSTILLA",
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
    nombre: "C/CERDO LOMO",
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
    nombre: "C/CERDO PERNIL",
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
    nombre: "C/CERDO TOCINETA",
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
        { codigo: "10358", nombre: "Pernil" },
      ]
    ),
  },
];

export const getMaterialesPorEspecie = (especie: Especie) =>
  TALLER_MATERIALES.filter((material) => material.especie === especie);
