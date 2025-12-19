export const parseWeightInput = (value: string): number => {
  const parsed = Number(value.replace(/,/g, "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatKg = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
