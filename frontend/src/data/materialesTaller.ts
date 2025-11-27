import { Item } from "../types";

export const getItemNombre = (item: Item): string =>
  (item.nombre ?? item.descripcion ?? "").trim();

export type EspecieKey = "res" | "cerdo";

export interface MaterialConfig {
  label: string;
  codigo?: string;
  aliases?: string[];
  principal?: boolean;
  children?: MaterialConfig[];
}

const resSecondaryDefaults: MaterialConfig[] = [
  { label: "Recorte" },
  { label: "Gordana" },
];

const cerdoSecondaryDefaults: MaterialConfig[] = [
  { label: "Recorte" },
  { label: "Empella" },
];

const recorteBase: MaterialConfig = {
  label: "Recorte",
  codigo: "33647",
  aliases: ["33647 Recorte"],
};

const gordanaBase: MaterialConfig = {
  label: "Gordana",
  codigo: "22835",
  aliases: ["22835 Gordana"],
};

const cerdoCommonSecondaryCuts: MaterialConfig[] = [
  { label: "Recorte", codigo: "33647", aliases: ["33647 Recorte"] },
  { label: "Empella", codigo: "5800", aliases: ["5800 Empella"] },
];

const cerdoCostillaSecondaryCuts: MaterialConfig[] = [
  { label: "Costichi", codigo: "70165", aliases: ["70165 Costichi"] },
  { label: "Empella", codigo: "5800", aliases: ["5800 Empella"] },
  { label: "Garra", codigo: "7860", aliases: ["7860 Garra"] },
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
  defaults: MaterialConfig[],
  extras: MaterialConfig[] = []
): MaterialConfig[] => mergeMaterialConfigs(defaults, extras);

const createPrimary = (
  label: string,
  defaults: MaterialConfig[],
  extras: MaterialConfig[] = [],
  codigo?: string
): MaterialConfig => ({
  label,
  principal: true,
  codigo,
  children: createChildren(defaults, extras),
});

const resSecondaryCuts = {
  recorte: recorteBase,
  gordana: gordanaBase,
  recorteMuchacho: {
    label: "Recorte 5843",
    codigo: "5843",
    aliases: ["5843 Recorte", "Recorte Muchacho"],
  },
  pulpa: {
    label: "Pulpa",
    codigo: "11018",
    aliases: ["11018 Pulpa", "Pulpa Normal"],
  },
  caderitaNormal: {
    label: "Caderita Normal",
    codigo: "7833",
    aliases: ["7833 Caderita Normal"],
  },
  costillaEspecial: {
    label: "Costilla Especial",
    codigo: "6415",
    aliases: ["6415 Costilla Especial"],
  },
  costillaLight: {
    label: "Costilla Light",
    codigo: "33642",
    aliases: ["33642 Costilla Light"],
  },
  huesoPromo: {
    label: "Hueso Promo",
    codigo: "37508",
    aliases: ["37508 Hueso Promo"],
  },
  desperdicio: {
    label: "Desperdicio",
    codigo: "31682",
    aliases: ["31682 Desperdicio"],
  },
  ampolletaNormal: {
    label: "Ampolleta Normal",
    codigo: "7776",
    aliases: ["7776 Ampolleta"],
  },
  espadilla: {
    label: "Espadilla/Paloma",
    codigo: "5834",
    aliases: ["5834 Espadilla", "Espaldilla", "Paloma"],
  },
};

const withRecorteGordana = (...extras: MaterialConfig[]): MaterialConfig[] =>
  mergeMaterialConfigs([recorteBase, gordanaBase, ...extras]);

const resPrimaryCuts: MaterialConfig[] = [
  {
    label: "Ampolleta Normal",
    codigo: "7776",
    principal: true,
    children: withRecorteGordana(),
  },
  {
    label: "Bola Negra Especial",
    codigo: "5585",
    principal: true,
    children: withRecorteGordana(resSecondaryCuts.pulpa),
    aliases: ["Bola Negra Espec"],
  },
  {
    label: "Caderita Especial",
    codigo: "25493",
    principal: true,
    children: withRecorteGordana(resSecondaryCuts.caderitaNormal),
  },
  {
    label: "Costilla Normal",
    codigo: "6415",
    principal: true,
    children: withRecorteGordana(
      resSecondaryCuts.costillaEspecial,
      resSecondaryCuts.costillaLight,
      resSecondaryCuts.huesoPromo
    ),
  },
  {
    label: "Espadilla/Paloma",
    codigo: "5834",
    principal: true,
    children: withRecorteGordana(),
    aliases: ["Espadilla", "Paloma"],
  },
  {
    label: "Lomo Caracha",
    codigo: "5856",
    principal: true,
    children: withRecorteGordana(),
  },
  {
    label: "Lomo Redondo",
    codigo: "5871",
    principal: true,
    children: withRecorteGordana(resSecondaryCuts.desperdicio),
  },
  {
    label: "Morrillo",
    codigo: "7843",
    principal: true,
    children: withRecorteGordana(),
    aliases: ["Morrillo*Kilo"],
  },
  {
    label: "Muchacho",
    codigo: "5854",
    principal: true,
    children: mergeMaterialConfigs([
      resSecondaryCuts.recorteMuchacho,
      gordanaBase,
    ]),
  },
  {
    label: "Pulpa Normal",
    codigo: "11018",
    principal: true,
    children: withRecorteGordana(resSecondaryCuts.desperdicio),
  },
  {
    label: "Punta de Anca",
    codigo: "7767",
    principal: true,
    children: withRecorteGordana(resSecondaryCuts.ampolletaNormal),
    aliases: ["Punta Anca"],
  },
  {
    label: "Punta Falda",
    codigo: "7768",
    principal: true,
    children: withRecorteGordana(resSecondaryCuts.pulpa),
  },
  {
    label: "Sobaco",
    codigo: "8037",
    principal: true,
    children: withRecorteGordana(),
  },
  {
    label: "Sobrebarriga",
    codigo: "5837",
    principal: true,
    children: withRecorteGordana(),
  },
  {
    label: "Pecho",
    codigo: "5844",
    principal: true,
    children: withRecorteGordana(resSecondaryCuts.espadilla),
  },
  {
    label: "Pepino",
    codigo: "8005",
    principal: true,
    children: withRecorteGordana(resSecondaryCuts.pulpa),
  },
  {
    label: "Lomo Viche Especial",
    codigo: "5848",
    principal: true,
    children: withRecorteGordana(),
  },
];

const cerdoPrimaryCuts: {
  label: string;
  codigo: string;
  children: MaterialConfig[];
  extras?: MaterialConfig[];
}[] = [
  { label: "Brazo", codigo: "9324", children: cerdoCommonSecondaryCuts },
  {
    label: "Costilla",
    codigo: "10251",
    children: cerdoCostillaSecondaryCuts,
  },
  { label: "Lomo", codigo: "5810", children: cerdoCommonSecondaryCuts },
  { label: "Pernil", codigo: "35164", children: cerdoCommonSecondaryCuts },
  { label: "Tocineta", codigo: "5828", children: cerdoCommonSecondaryCuts },
];

export const materialesPorEspecie: Record<EspecieKey, MaterialConfig[]> = {
  res: resPrimaryCuts,
  cerdo: cerdoPrimaryCuts.map(({ label, extras, codigo, children }) =>
    createPrimary(label, children, extras, codigo)
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
  const description = getItemNombre(item);
  const normalizedDescription = normalize(description);
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
