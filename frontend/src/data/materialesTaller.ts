import { Item } from "../types";
import { Especie, TALLER_MATERIALES } from "./talleres";

export type EspecieKey = Especie;

export interface MaterialOptionConfig {
  codigo: string;
  label: string;
  principal: boolean;
  especie: Especie;
}

export interface ResolvedMaterialOption {
  config: MaterialOptionConfig;
  item?: Item;
}

const MATERIAL_OPTIONS: MaterialOptionConfig[] = TALLER_MATERIALES.map(
  (material) => ({
    codigo: material.codigo,
    label: material.nombre,
    principal: true,
    especie: material.especie,
  })
);

export const resolveMaterialOptions = (
  items: Item[],
  especie: EspecieKey
): ResolvedMaterialOption[] =>
  MATERIAL_OPTIONS.filter((option) => option.especie === especie).map(
    (config) => ({
      config,
      item: items.find((item) => item.codigo_producto === config.codigo),
    })
  );
