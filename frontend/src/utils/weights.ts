export const parseWeightInput = (value: string): number => {
  const parsed = Number(value.replace(/,/g, "."));
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, parsed);
};
export const isNegativeInputValue = (value: string): boolean => value.trim().startsWith("-");

export const formatKg = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
