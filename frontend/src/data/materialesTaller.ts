import { Item } from "../types";

export type EspecieKey = "res" | "cerdo";

export interface MaterialConfig {
  label: string;
  codigo?: string;
  principal?: boolean;
  children?: MaterialConfig[];
}

const defaultSecondaryCuts: MaterialConfig[] = [
  { label: "Recorte fino" },
  { label: "Recorte grueso" },
  { label: "Gordana" },
  { label: "Grasa" },
  { label: "Descarne" },
  { label: "Hueso" },
  { label: "Chinchurria" },
  { label: "Corte descartado" },
];

const createChildren = (extras: MaterialConfig[] = []): MaterialConfig[] =>
  [...defaultSecondaryCuts, ...extras].map((child) => ({ ...child }));

const createPrimary = (
  label: string,
  extras: MaterialConfig[] = []
): MaterialConfig => ({
  label,
  principal: true,
  children: createChildren(extras),
});

const resPrimaryCuts = [
  "Pulpa",
  "Costilla",
  "Espaldilla",
  "Pecho",
  "Lomo Redondo",
  "Cadera",
  "Morrillo",
  "Sobrebarriga",
  "Punta de Anca",
  "Pierna",
];

const cerdoPrimaryCuts = [
  "Cabeza",
  "Costilla",
  "Pernil",
  "Panceta",
  "Lomo",
  "Tocineta",
  "Espaldilla",
];

const cerdoSecondaryExtras: MaterialConfig[] = [
  { label: "Recorte" },
  { label: "Costichi" },
];

export const materialesPorEspecie: Record<EspecieKey, MaterialConfig[]> = {
  res: resPrimaryCuts.map((label) => createPrimary(label)),
  cerdo: cerdoPrimaryCuts.map((label) =>
    createPrimary(label, cerdoSecondaryExtras)
  ),
};

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

const matchesMaterial = (item: Item, material: MaterialConfig): boolean => {
  const normalizedDescription = normalize(item.descripcion);
  const normalizedLabel = normalize(material.label);

  if (
    material.codigo &&
    normalize(item.codigo_producto) === normalize(material.codigo)
  ) {
    return true;
  }

  return normalizedDescription === normalizedLabel;
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
  const filteredItems = items.filter(
    (item) => normalize(item.especie) === normalize(especie)
  );

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
