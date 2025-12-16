export type Especie = "res" | "cerdo";

export interface SubcorteDefinition {
  codigo: string;
  nombre: string;
}

export interface MaterialDefinition {
  codigo: string;
  nombre: string;
  especie: Especie;
  subcortes: SubcorteDefinition[];
}

export const TALLER_MATERIALES: MaterialDefinition[] = [
  {
    especie: "res",
    codigo: "57654",
    nombre: "Ampolleta Normal",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "22835", nombre: "Gordana" },
    ],
  },
  {
    especie: "res",
    codigo: "5588",
    nombre: "Bola Negra Especial",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "22835", nombre: "Gordana" },
      { codigo: "11018", nombre: "Pulpa" },
    ],
  },
  {
    especie: "res",
    codigo: "25493",
    nombre: "Caderita Especial",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "22835", nombre: "Gordana" },
      { codigo: "7833", nombre: "Caderita Normal" },
    ],
  },
  {
    especie: "res",
    codigo: "6415",
    nombre: "Costilla Normal",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "22835", nombre: "Gordana" },
      { codigo: "6415", nombre: "Costilla Especial" },
      { codigo: "33642", nombre: "Costilla Light" },
      { codigo: "37508", nombre: "Hueso Promo" },
    ],
  },
  {
    especie: "res",
    codigo: "5834",
    nombre: "Espadilla/Paloma",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "22835", nombre: "Gordana" },
    ],
  },
  {
    especie: "res",
    codigo: "21274",
    nombre: "Lomo Caracha",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "22835", nombre: "Gordana" },
    ],
  },
  {
    especie: "res",
    codigo: "26507",
    nombre: "Lomo Redondo",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "22835", nombre: "Gordana" },
      { codigo: "31682", nombre: "Desperdicio" },
    ],
  },
  {
    especie: "res",
    codigo: "7849",
    nombre: "Morrillo",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "22835", nombre: "Gordana" },
    ],
  },
  {
    especie: "res",
    codigo: "20182",
    nombre: "Muchacho",
    subcortes: [
      { codigo: "5843", nombre: "Recorte Muchacho" },
      { codigo: "22835", nombre: "Gordana" },
    ],
  },
  {
    especie: "res",
    codigo: "11018",
    nombre: "Pulpa Normal",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "22835", nombre: "Gordana" },
      { codigo: "31682", nombre: "Desperdicio" },
    ],
  },
  {
    especie: "res",
    codigo: "30358",
    nombre: "Punta de Anca",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "22835", nombre: "Gordana" },
      { codigo: "7776", nombre: "Ampolleta Normal" },
    ],
  },
  {
    especie: "res",
    codigo: "25990",
    nombre: "Punta Falda",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "22835", nombre: "Gordana" },
      { codigo: "11018", nombre: "Pulpa" },
    ],
  },
  {
    especie: "res",
    codigo: "8037",
    nombre: "Sobaco",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "22835", nombre: "Gordana" },
    ],
  },
  {
    especie: "res",
    codigo: "35139",
    nombre: "Sobrebarriga",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "22835", nombre: "Gordana" },
    ],
  },
  {
    especie: "res",
    codigo: "70389",
    nombre: "Pecho",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "22835", nombre: "Gordana" },
      { codigo: "5834", nombre: "Espadilla/Paloma" },
    ],
  },
  {
    especie: "res",
    codigo: "7755",
    nombre: "Pepino",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "22835", nombre: "Gordana" },
      { codigo: "11018", nombre: "Pulpa" },
    ],
  },
  {
    especie: "res",
    codigo: "25895",
    nombre: "Lomo Viche Especial",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "22835", nombre: "Gordana" },
    ],
  },
  {
    especie: "cerdo",
    codigo: "33649",
    nombre: "Brazo",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "5800", nombre: "Empella" },
    ],
  },
  {
    especie: "cerdo",
    codigo: "10351",
    nombre: "Costilla",
    subcortes: [
      { codigo: "70165", nombre: "Costichi" },
      { codigo: "5800", nombre: "Empella" },
      { codigo: "7860", nombre: "Garra" },
    ],
  },
  {
    especie: "cerdo",
    codigo: "30151",
    nombre: "Lomo",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "5800", nombre: "Empella" },
    ],
  },
  {
    especie: "cerdo",
    codigo: "10358",
    nombre: "Pernil",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "5800", nombre: "Empella" },
    ],
  },
  {
    especie: "cerdo",
    codigo: "30029",
    nombre: "Tocineta",
    subcortes: [
      { codigo: "33647", nombre: "Recorte" },
      { codigo: "5800", nombre: "Empella" },
    ],
  },
];

export const getMaterialesPorEspecie = (especie: Especie) =>
  TALLER_MATERIALES.filter((material) => material.especie === especie);
