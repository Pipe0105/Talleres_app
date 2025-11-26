import { Item } from "../types";

export type EspecieKey = "res" | "cerdo";

export interface MaterialConfig {
  label: string;
  codigo?: string;
  aliases?: string[];
  principal?: boolean;
  children?: MaterialConfig[];
}

const sharedSecondaryCuts: MaterialConfig[] = [
  { label: "Recorte fino" },
  { label: "Recorte grueso" },
  { label: "Gordana" },
  { label: "Grasa" },
  { label: "Descarne" },
  { label: "Hueso" },
  { label: "Chinchurria" },
  { label: "Corte descartado" },
];

const resSecondaryExtras: MaterialConfig[] = [
  { label: "1108 Pulpa" },
  { label: "6415 Caderita Normal" },
  { label: "33642 Costilla Light" },
  { label: "31622 Desperdicio" },
  { label: "5854 Muchacho" },
  { label: "5808 Pulpa Normal" },
];

const resBaseSecondaryCuts: MaterialConfig[] = [
  ...sharedSecondaryCuts,
  { label: "Recorte", aliases: ["33647 Recorte"] },
  { label: "Gordana", aliases: ["22835 Gordana"] },
];

const cerdoBaseSecondaryCuts: MaterialConfig[] = [
  ...sharedSecondaryCuts,
  { label: "Recorte", aliases: ["33647 Recorte"] },
  { label: "Empella", aliases: ["5800 Empella"] },
];

const normalizeMaterialKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^[0-9\s]+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const mergeMaterialConfigs = (
  ...groups: MaterialConfig[][]
): MaterialConfig[] => {
  const seen = new Set<string>();
  return groups.flat().reduce<MaterialConfig[]>((result, config) => {
    const key = normalizeMaterialKey(config.label);
    if (!key || seen.has(key)) {
      return result;
    }

    seen.add(key);
    result.push({ ...config });
    return result;
  }, []);
};

const createChildren = (
  base: MaterialConfig[],
  extras: MaterialConfig[] = []
): MaterialConfig[] => mergeMaterialConfigs(base, extras);

const createPrimary = (
  label: string,
  baseChildren: MaterialConfig[],
  extras: MaterialConfig[] = []
): MaterialConfig => ({
  label,
  principal: true,
  children: createChildren(baseChildren, extras),
});

const resPrimarySpecificExtras: Record<string, MaterialConfig[]> = {
  "Bola Negra Especial": [{ label: "Pulpa" }],
  "Caderita Especial": [{ label: "Caderita Normal" }],
  "Costilla Normal": [
    { label: "Costilla Especial" },
    { label: "Costilla Light" },
    { label: "Hueso promo" },
  ],
  "Lomo Redondo": [{ label: " Desperdicio" }],
  "Pulpa Normal": [{ label: "Desperdicio" }],
  "Punta de Anca": [{ label: "Ampolleta " }],
  "Punta Falda": [{ label: "Pulpa" }],
  "Pecho ": [{ label: "Espaldilla" }],
  "Pepino ": [{ label: "Pulpa Normal" }],
};

const resPrimaryCuts = [
  "Ampolleta Normal",
  "Bola Negra Especial",
  "Caderita Especial",
  "Costilla Normal",
  "Costilla Especial",
  "Costilla Light",
  "Hueso Promo",
  "Espaldilla Paloma",
  "Lomo Caracha",
  "Lomo Redondo",
  "Morrillo ",
  "Muchacho",
  "Pulpa Normal",
  "Punta a Anca",
  "Ampolleta",
  "Punta Falda",
  "Sobaco",
  "Sobrebarriga",
  "Pecho",
  "Espaldilla",
  "Pepino",
  "Lomo Viche Especial",
];

const cerdoPrimaryCuts: { label: string; extras?: MaterialConfig[] }[] = [
  { label: "Brazo" },
  {
    label: "Costilla",
    extras: [{ label: "Costichi" }, { label: "Garra" }],
  },
  { label: "Costichi" },
  { label: "Garra" },
  { label: "Lomo" },
  { label: "Pernil" },
  { label: "Tocineta" },
];

export const materialesPorEspecie: Record<EspecieKey, MaterialConfig[]> = {
  res: resPrimaryCuts.map((label) =>
    createPrimary(
      label,
      resBaseSecondaryCuts,
      mergeMaterialConfigs(
        resSecondaryExtras,
        resPrimarySpecificExtras[label] ?? []
      )
    )
  ),
  cerdo: cerdoPrimaryCuts.map(({ label, extras }) =>
    createPrimary(label, cerdoBaseSecondaryCuts, extras)
  ),
};

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const simplify = (value: string): string =>
  value
    .replace(/\b(DE|DEL|LA|EL|LOS|LAS|Y)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeCodigo = (codigo: string): string =>
  codigo.replace(/[^0-9A-Z]/gi, "").toUpperCase();

const speciesFromValue = (value: string): EspecieKey | null => {
  const normalized = normalize(value);

  if (/CERD|PORC/.test(normalized)) {
    return "cerdo";
  }

  if (/RES|VACUN|BOVIN/.test(normalized)) {
    return "res";
  }

  return null;
};

const matchesMaterial = (item: Item, material: MaterialConfig): boolean => {
  const normalizedDescription = normalize(item.descripcion);
  const simplifiedDescription = simplify(normalizedDescription);
  const normalizedLabel = normalize(material.label);

  const simplifiedLabel = simplify(normalizedLabel);
  const normalizedAliases = (material.aliases ?? []).map(normalize);

  const descriptionIncludesAllTokens = (target: string): boolean => {
    const tokens = target.split(" ").filter(Boolean);
    return (
      tokens.length > 0 &&
      tokens.every(
        (token) =>
          normalizedDescription.includes(token) ||
          simplifiedDescription.includes(token)
      )
    );
  };

  if (material.codigo) {
    const materialCode = normalizeCodigo(material.codigo);
    const itemCode = normalizeCodigo(item.codigo_producto);
    if (materialCode && materialCode === itemCode) {
      return true;
    }
  }

  const descriptionTargets = [
    normalizedLabel,
    simplifiedLabel,
    ...normalizedAliases.flatMap((alias) => [alias, simplify(alias)]),
  ];

  return descriptionTargets.some((target) => {
    if (!target.length) {
      return false;
    }

    return (
      normalizedDescription === target ||
      simplifiedDescription === target ||
      normalizedDescription.includes(target) ||
      simplifiedDescription.includes(target) ||
      descriptionIncludesAllTokens(target)
    );
  });
};

export interface ResolvedMaterialOption {
  config: MaterialConfig;
  item: Item | null;
  children?: ResolvedMaterialOption[];
}

export const resolveMaterialOptions = (
  items: Item[],
  especie: EspecieKey
): ResolvedMaterialOption[] => {
  const allowedMaterials = materialesPorEspecie[especie];
  const filteredItems = items.filter((item) => {
    const resolvedSpecies = speciesFromValue(item.especie);
    return resolvedSpecies === especie || resolvedSpecies === null;
  });

  const mapOption = (option: MaterialConfig): ResolvedMaterialOption => {
    const matchedItem =
      filteredItems.find((item) => matchesMaterial(item, option)) ?? null;

    return {
      config: option,
      item: matchedItem,
      children: option.children?.map(mapOption),
    };
  };

  return allowedMaterials.map(mapOption);
};
