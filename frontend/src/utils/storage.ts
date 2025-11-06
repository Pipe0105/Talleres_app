const isBrowser = typeof window !== "undefined" && Boolean(window.localStorage);

export const safeStorage = {
  getItem(key: string) {
    if (!isBrowser) {
      return null;
    }
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn("No se pudo leer desde localStorage", error);
      return null;
    }
  },
  setItem(key: string, value: string) {
    if (!isBrowser) {
      return;
    }
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.warn("No se pudo escribir en localStorage", error);
    }
  },
  removeItem(key: string) {
    if (!isBrowser) {
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn("No se pudo eliminar la clave de localStorage", error);
    }
  },
};

export const safeNumberFromStorage = (key: string): number | null => {
  const value = safeStorage.getItem(key);
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};
