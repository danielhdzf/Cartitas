// Filas tal como las devuelven las vistas de Supabase (los numeric llegan como number).

export const IDIOMAS = [
  ["JP", "Japonés"],
  ["EN", "Inglés"],
  ["ES", "Español"],
  ["FR", "Francés"],
  ["DE", "Alemán"],
  ["IT", "Italiano"],
  ["PT", "Portugués"],
  ["KO", "Coreano"],
  ["ZH", "Chino"],
] as const;

export const ESTADOS = [
  ["MT", "Mint"],
  ["NM", "Near Mint"],
  ["EX", "Excellent"],
  ["GD", "Good"],
  ["LP", "Light Played"],
  ["PL", "Played"],
  ["PO", "Poor"],
] as const;

export type ProductoBuscado = {
  id_producto: number;
  nombre: string;
  id_expansion: number | null;
  trend: number | null;
  trend_holo: number | null;
  imagen_url: string | null;
};

export type Ejemplar = {
  id: number;
  id_producto: number;
  origen: "pedido" | "sobre";
  id_pedido: number | null;
  precio_compra: number | null;
  fecha_obtencion: string | null;
  idioma: string;
  estado: string;
  es_holo: boolean;
  valor_referencia: number | null;
  fuente_valor: "exacto" | "aproximado" | "manual" | null;
  notas: string | null;
  nombre: string;
  id_expansion: number | null;
  imagen_url: string | null;
  fecha: string;
  vendedor: string | null;
  envio_asignado: number | null;
  valor_actual: number | null;
  precio_fecha: string | null;
  coste_total: number | null;
  beneficio: number | null;
  beneficio_pct: number | null;
  revalorizacion: number | null;
};

export type Pedido = {
  id: number;
  fecha: string;
  vendedor: string | null;
  plataforma: string;
  envio_total: number;
  otros_gastos: number;
  reparto: "iguales" | "proporcional";
  notas: string | null;
  cartas: number;
  total_cartas: number;
  coste_total: number;
  valor_actual: number | null;
  beneficio: number | null;
};

export function nombreIdioma(codigo: string) {
  return IDIOMAS.find(([c]) => c === codigo)?.[1] ?? codigo;
}
