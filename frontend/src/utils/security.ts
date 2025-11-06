export interface SanitizeOptions {
  maxLength?: number;
}

const DEFAULT_MAX_LENGTH = 280;
const BLOCKED_PATTERN = /[<>`\\]/g;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const SAFE_CHAR_PATTERN = /[^0-9A-Za-zÁÉÍÓÚáéíóúÑñÜü\s.,;:()@%_\-\/&]/g;

export const sanitizeInput = (value: string, options: SanitizeOptions = {}) => {
  const { maxLength = DEFAULT_MAX_LENGTH } = options;
  return value
    .normalize("NFKC")
    .replace(CONTROL_CHARS, "")
    .replace(BLOCKED_PATTERN, "")
    .replace(SAFE_CHAR_PATTERN, "")
    .trim()
    .slice(0, maxLength);
};

export const sanitizeSearchQuery = (value: string, maxLength = 120) =>
  sanitizeInput(value, { maxLength }).toLowerCase();

export const isSafeFileType = (mimeType: string, allowed: readonly string[]) =>
  allowed.includes(mimeType);

export const isSafeFileSize = (size: number, maxBytes: number) =>
  Number.isFinite(size) && size > 0 && size <= maxBytes;

export const safeParseNumber = (value: string) => {
  if (!value.trim()) {
    return null;
  }
  const normalized = value.replace(/,/g, ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};
