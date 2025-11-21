import { Item } from "../types";

export type EspecieKey = "res" | "cerdo";

export interface MaterialConfig {
  label: string;
  codigo?: string;
  principal?: boolean;
  children?: MaterialConfig[];
}

export const materialesPorEspecie: Record<EspecieKey, MaterialConfig[]> = {
  res: [
    { label: "PAJARILLA ESPECIAL", codigo: "5050", principal: true },
    { label: "BOLA NEGRA ESPECIAL", codigo: "5220", principal: true },
    {
      label: "COLITA DE CADERA",
      codigo: "5200",
      principal: true,
      children: [
        { label: "CADERA ESPECIAL", codigo: "3501" },
        { label: "CADERA NORMAL", codigo: "3502" },
      ],
    },
    { label: "CHOCHO", codigo: "3503", principal: true },
    {
      label: "COSTILLA PAR",
      codigo: "5821",
      principal: true,
      children: [
        { label: "COSTILLA FAJA", codigo: "5052" },
        { label: "COSTILLA FAJA REMPL", codigo: "3443" },
      ],
    },
    {
      label: "ESPALDILLA",
      codigo: "5210",
      principal: true,
      children: [{ label: "RABO BISTE", codigo: "5200" }],
    },
    {
      label: "FALDA ALM",
      codigo: "5210",
      principal: true,
      children: [
        { label: "FALDA C/PUNTA", codigo: "5200" },
        { label: "FALDA S/PUNTA", codigo: "5200" },
      ],
    },
    { label: "HAMBURGUESA NORMAL", codigo: "3520", principal: true },
    { label: "LOMO BIFE", codigo: "5220", principal: true },
    { label: "LOMO AJALORIN", codigo: "5210", principal: true },
    { label: "LOMO ANGOSTO", codigo: "5200", principal: true },
    {
      label: "RIBEYE ESPEJITO",
      codigo: "5220",
      principal: true,
      children: [{ label: "TOMAHAWK", codigo: "5200" }],
    },
    {
      label: "PECHO",
      codigo: "5200",
      principal: true,
      children: [{ label: "PECHO SIN HUESO", codigo: "5200" }],
    },
    {
      label: "PORTER HOUSE",
      codigo: "5200",
      principal: true,
      children: [{ label: "T-BONE", codigo: "5210" }],
    },
    {
      label: "PUYAS",
      codigo: "5210",
      principal: true,
      children: [
        { label: "PUNTA ANCHA", codigo: "5200" },
        { label: "PUNTA DELGADA", codigo: "5200" },
      ],
    },
    {
      label: "SOLOMO",
      codigo: "5200",
      principal: true,
      children: [{ label: "TRONCO / LIBRILLO", codigo: "5200" }],
    },
  ],
  cerdo: [
    {
      label: "BRAZO",
      codigo: "9324",
      principal: true,
      children: [
        { label: "RECORTE", codigo: "33647" },
        { label: "EMPELLA", codigo: "5800" },
      ],
    },
    {
      label: "COSTILLA",
      codigo: "10251",
      principal: true,
      children: [
        { label: "COSTICHI", codigo: "70165" },
        { label: "EMPELLA", codigo: "5800" },
        { label: "GARRA", codigo: "7860" },
      ],
    },
    {
      label: "LOMO",
      codigo: "5810",
      principal: true,
      children: [
        { label: "RECORTE", codigo: "33647" },
        { label: "EMPELLA", codigo: "5800" },
      ],
    },
    {
      label: "PERNIL",
      codigo: "35164",
      principal: true,
      children: [
        { label: "RECORTE", codigo: "33647" },
        { label: "EMPELLA", codigo: "5800" },
      ],
    },
    {
      label: "TOCINETA",
      codigo: "5828",
      principal: true,
      children: [
        { label: "RECORTE", codigo: "33647" },
        { label: "EMPELLA", codigo: "5800" },
      ],
    },
  ],
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
