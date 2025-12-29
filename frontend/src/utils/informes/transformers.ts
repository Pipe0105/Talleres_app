import { TallerCalculoRow, TallerListItem } from "../../types";

type BuildTallerCalculoParams = {
  rows: TallerCalculoRow[];
  meta?: TallerListItem;
  tallerId: string;
  materialNames: Record<string, string>;
};

export type TallerCalculoWithMeta = TallerCalculoRow & {
  tallerId: number;
  tallerNombre: string;
  sede: string | null;
  material?: string | null;
  materialNombre: string | null;
  materialLabel: string;
  tallerGrupoId: number | null;
  groupKey: string;
  displayId: number;
  peso_inicial: number;
  peso_final: number;
  porcentaje_perdida: number | null;
  peso_subcortes: number;
};

export type MaterialGroup = {
  tallerId: number;
  label: string;
  material: string | null;
  materialNombre: string | null;
  pesoInicial: number;
  pesoFinal: number;
  porcentajePerdida: number | null;
  rows: TallerCalculoWithMeta[];
};

export type TallerCalculoGroup = {
  groupKey: string;
  displayId: number;
  groupLabel: string;
  sede: string | null;
  materiales: MaterialGroup[];
};

export type TallerItemComparison = {
  itemKey: string;
  itemLabel: string;
  itemCode: string | null;
  rows: TallerCalculoWithMeta[];
};
export type TallerMaterialComparisonGroup = {
  materialKey: string;
  materialLabel: string;
  materialCode: string | null;
  items: TallerItemComparison[];
};

export const formatTallerId = (id: number) => id.toString().padStart(2, "0");

export const buildTallerCalculoWithMeta = ({
  rows,
  meta,
  tallerId,
  materialNames,
}: BuildTallerCalculoParams): TallerCalculoWithMeta[] => {
  const materialCodigo = meta?.codigo_principal?.trim() ?? null;
  const materialNombre = materialCodigo ? (materialNames[materialCodigo] ?? null) : null;
  const materialLabel =
    materialNombre ?? materialCodigo ?? meta?.nombre_taller ?? `Taller ${tallerId}`;
  const grupoId = meta?.taller_grupo_id ?? null;
  const displayId = grupoId ?? Number(tallerId);
  const groupKey = grupoId ? `grupo-${grupoId}` : `taller-${tallerId}`;
  const pesoInicial = meta?.peso_inicial ?? 0;
  const pesoFinal = meta?.peso_final ?? 0;
  const porcentajePerdida = meta?.porcentaje_perdida ?? null;
  const totalSubcortesPeso = rows.reduce((acc, row) => acc + row.peso, 0);

  return rows.map((row) => ({
    ...row,
    tallerId: Number(tallerId),
    tallerNombre: meta?.nombre_taller ?? `Taller ${tallerId}`,
    sede: meta?.sede ?? null,
    materialNombre,
    materialLabel,
    tallerGrupoId: grupoId,
    groupKey,
    displayId,
    peso_inicial: pesoInicial,
    peso_final: pesoFinal,
    porcentaje_perdida: porcentajePerdida,
    peso_subcortes: totalSubcortesPeso,
  }));
};

export const calculateResumen = (rows: TallerCalculoWithMeta[]) => {
  const totalPeso = rows.reduce((acc, row) => acc + row.peso, 0);
  const totalValor = rows.reduce((acc, row) => acc + (row.valor_estimado ?? 0), 0);
  const talleresContados = new Set(rows.map((row) => row.groupKey)).size;

  return {
    totalPeso,
    totalValor,
    cortes: rows.length,
    talleres: talleresContados,
  };
};

export const groupCalculoByTaller = (
  rows: TallerCalculoWithMeta[],
  selectedTallerIds: string[]
): TallerCalculoGroup[] => {
  if (!rows.length) {
    return [];
  }

  const groups = new Map<
    string,
    {
      groupKey: string;
      displayId: number;
      sede: string | null;
      materiales: Map<number, MaterialGroup>;
    }
  >();

  rows.forEach((row) => {
    const materialLabel = row.materialNombre ?? row.material ?? row.tallerNombre;
    const existingGroup = groups.get(row.groupKey);
    if (existingGroup) {
      const existingMaterial = existingGroup.materiales.get(row.tallerId);
      if (existingMaterial) {
        existingMaterial.rows.push(row);
      } else {
        existingGroup.materiales.set(row.tallerId, {
          tallerId: row.tallerId,
          label: materialLabel,
          material: row.material ?? null,
          materialNombre: row.materialNombre,
          pesoInicial: row.peso_inicial,
          pesoFinal: row.peso_final,
          porcentajePerdida: row.porcentaje_perdida,
          rows: [row],
        });
      }
      return;
    }

    const materiales = new Map<number, MaterialGroup>();
    materiales.set(row.tallerId, {
      tallerId: row.tallerId,
      label: materialLabel,
      material: row.material ?? null,
      materialNombre: row.materialNombre,
      pesoInicial: row.peso_inicial,
      pesoFinal: row.peso_final,
      porcentajePerdida: row.porcentaje_perdida,
      rows: [row],
    });
    groups.set(row.groupKey, {
      groupKey: row.groupKey,
      displayId: row.displayId,
      sede: row.sede,
      materiales,
    });
  });

  const ordered: TallerCalculoGroup[] = [];
  const seen = new Set<string>();

  selectedTallerIds.forEach((id) => {
    const numericId = Number(id);
    const maybeGroup = rows.find((row) => row.tallerId === numericId);
    if (!maybeGroup) {
      return;
    }

    const group = groups.get(maybeGroup.groupKey);
    if (group && !seen.has(group.groupKey)) {
      const materiales = Array.from(group.materiales.values());
      const groupLabel =
        materiales.length > 1
          ? `Taller completo ${formatTallerId(group.displayId)}`
          : (materiales[0]?.label ?? `Taller ${formatTallerId(group.displayId)}`);

      ordered.push({
        groupKey: group.groupKey,
        displayId: group.displayId,
        groupLabel,
        sede: group.sede,
        materiales,
      });
      seen.add(group.groupKey);
    }
  });

  groups.forEach((group) => {
    if (!seen.has(group.groupKey)) {
      const materiales = Array.from(group.materiales.values());
      const groupLabel =
        materiales.length > 1
          ? `Taller completo ${formatTallerId(group.displayId)}`
          : (materiales[0]?.label ?? `Taller ${formatTallerId(group.displayId)}`);

      ordered.push({
        groupKey: group.groupKey,
        displayId: group.displayId,
        groupLabel,
        sede: group.sede,
        materiales,
      });
    }
  });

  return ordered;
};

export const groupCalculoByItem = (
  rows: TallerCalculoWithMeta[]
): TallerMaterialComparisonGroup[] => {
  if (!rows.length) {
    return [];
  }

  const groups = new Map<
    string,
    {
      materialKey: string;
      materialLabel: string;
      materialCode: string | null;
      items: Map<string, TallerItemComparison>;
    }
  >();

  rows.forEach((row) => {
    const normalizedCode = row.item_code?.trim();
    const normalizedName = row.nombre_corte?.trim() ?? "";
    const materialCode = row.material?.trim() ?? null;
    const materialLabel = row.materialLabel?.trim() ?? "Corte principal";
    const materialKey = (materialCode ?? materialLabel).toLowerCase();
    const itemKey = normalizedCode
      ? `code:${normalizedCode.toLowerCase()}`
      : `name:${normalizedName.toLowerCase()}`;
    const group = groups.get(materialKey);

    if (!group) {
      groups.set(materialKey, {
        materialKey,
        materialLabel,
        materialCode,
        items: new Map([
          [
            itemKey,
            {
              itemKey,
              itemLabel: normalizedName || normalizedCode || "Item sin nombre",
              itemCode: normalizedCode || null,
              rows: [row],
            },
          ],
        ]),
      });
      return;
    }

    const existingItem = group.items.get(itemKey);
    if (existingItem) {
      existingItem.rows.push(row);
      return;
    }

    group.items.set(itemKey, {
      itemKey,
      itemLabel: normalizedName || normalizedCode || "Item sin nombre",
      itemCode: normalizedCode || null,
      rows: [row],
    });
  });

  return Array.from(groups.values())
    .map((group) => ({
      materialKey: group.materialKey,
      materialLabel: group.materialLabel,
      materialCode: group.materialCode,
      items: Array.from(group.items.values()).sort((a, b) =>
        a.itemLabel.localeCompare(b.itemLabel)
      ),
    }))
    .sort((a, b) => a.materialLabel.localeCompare(b.materialLabel));
};
