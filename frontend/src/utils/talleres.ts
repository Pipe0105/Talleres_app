import { Producto, Taller } from "../types";

export interface CorteCalculado {
  id: number;
  codigo: number;
  nombre: string;
  peso: number;
  porcentaje: number;
  esPrincipal: boolean;
}

export interface TallerGrupoCalculado {
  grupo: string;
  fecha: string;
  responsable: string;
  productoPrincipal: string;
  codigoPrincipal: number | null;
  pesoInicial: number;
  pesoProcesado: number;
  porcentajeProcesado: number;
  mermaKg: number;
  mermaPorcentaje: number;
  cortes: CorteCalculado[];
}

const roundKg = (valor: number): number => Number(valor.toFixed(3));

const roundPct = (valor: number): number => Number(valor.toFixed(4));

export const construirMapaProductos = (
  productos: Producto[]
): Map<number, Producto> =>
  new Map(productos.map((producto) => [producto.id, producto] as const));

const agruparPorGrupo = (talleres: Taller[]): Map<string, Taller[]> => {
  const mapa = new Map<string, Taller[]>();

  talleres.forEach((taller) => {
    const existentes = mapa.get(taller.grupo);
    if (existentes) {
      existentes.push(taller);
    } else {
      mapa.set(taller.grupo, [taller]);
    }
  });

  return mapa;
};

export const calcularGruposDeTalleres = (
  talleres: Taller[],
  productoMap: Map<number, Producto>
): TallerGrupoCalculado[] => {
  const grupos = agruparPorGrupo(talleres);
  const resultados: TallerGrupoCalculado[] = [];

  const buscarProducto = (
    productoId: number | null | undefined,
    codigo: number | null | undefined
  ): Producto | undefined => {
    if (productoId != null) {
      const porId = productoMap.get(productoId);
      if (porId) {
        return porId;
      }
    }

    if (codigo != null) {
      for (const producto of productoMap.values()) {
        if (producto.codigo === codigo) {
          return producto;
        }
      }
    }

    return undefined;
  };

  grupos.forEach((talleresDelGrupo, grupo) => {
    if (talleresDelGrupo.length === 0) {
      return;
    }

    const principal =
      talleresDelGrupo.find(
        (t) => typeof t.peso_inicial === "number" && t.peso_inicial > 0
      ) ?? talleresDelGrupo[0];

    const productoPrincipal = buscarProducto(
      principal.producto_id,
      principal.codigo
    );

    const pesoInicialCalculado =
      typeof principal.peso_inicial === "number" && principal.peso_inicial > 0
        ? principal.peso_inicial
        : talleresDelGrupo.reduce(
            (acum, taller) => acum + taller.peso_taller,
            0
          );

    const cortes: CorteCalculado[] = talleresDelGrupo
      .map((taller) => {
        const producto = buscarProducto(taller.producto_id, taller.codigo);
        const peso = taller.peso_taller;
        const porcentaje =
          pesoInicialCalculado > 0 ? (peso / pesoInicialCalculado) * 100 : 0;

        return {
          id: taller.id,
          codigo: taller.codigo,
          nombre: producto?.nombre ?? "Producto sin nombre",
          peso: roundKg(peso),
          porcentaje: roundPct(porcentaje),
          esPrincipal: taller.id === principal.id,
        } satisfies CorteCalculado;
      })
      .sort((a, b) => {
        if (a.esPrincipal && !b.esPrincipal) {
          return -1;
        }
        if (!a.esPrincipal && b.esPrincipal) {
          return 1;
        }
        if (b.peso !== a.peso) {
          return b.peso - a.peso;
        }
        return a.nombre.localeCompare(b.nombre);
      });

    const pesoProcesado = cortes.reduce((acum, corte) => acum + corte.peso, 0);
    const merma = Math.max(pesoInicialCalculado - pesoProcesado, 0);
    const porcentajeProcesado =
      pesoInicialCalculado > 0
        ? (pesoProcesado / pesoInicialCalculado) * 100
        : 0;
    const porcentajeMerma =
      pesoInicialCalculado > 0 ? (merma / pesoInicialCalculado) * 100 : 0;

    resultados.push({
      grupo,
      fecha: principal.fecha,
      responsable: principal.creado_por,
      productoPrincipal: productoPrincipal?.nombre ?? "Producto sin nombre",
      codigoPrincipal: principal.codigo ?? null,
      pesoInicial: roundKg(pesoInicialCalculado),
      pesoProcesado: roundKg(pesoProcesado),
      porcentajeProcesado: roundPct(porcentajeProcesado),
      mermaKg: roundKg(merma),
      mermaPorcentaje: roundPct(porcentajeMerma),
      cortes,
    });
  });

  return resultados.sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
};

export const construirMapaDeGrupos = (
  talleres: Taller[],
  productoMap: Map<number, Producto>
): Map<string, TallerGrupoCalculado> => {
  const calculados = calcularGruposDeTalleres(talleres, productoMap);
  return new Map(calculados.map((item) => [item.grupo, item] as const));
};
