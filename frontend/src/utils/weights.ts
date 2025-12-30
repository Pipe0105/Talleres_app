export const parseWeightInput = (value: string): number => {
  const parsed = Number(value.replace(/,/g, "."));
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, parsed);
};
export const isNegativeInputValue = (value: string): boolean => value.trim().startsWith("-");

const ZERO_TOLERANCE = 0.005;

export const normalizeZero = (value: number) =>
  Object.is(value, -0) || Math.abs(value) < ZERO_TOLERANCE ? 0 : value;

export const formatKg = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalizeZero(value));

export const formatPercent = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalizeZero(value));
