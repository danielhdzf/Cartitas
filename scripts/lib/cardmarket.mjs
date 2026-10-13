// Lectura y transformación de los ficheros públicos de CardMarket.
// Funciones puras: no tocan red ni base de datos, para poder probarlas.

export const ID_JUEGO_POKEMON = 6;

// Se puede cambiar con CARDMARKET_BASE_URL para probar con ficheros locales.
const BASE = process.env.CARDMARKET_BASE_URL ?? "https://downloads.s3.cardmarket.com/productCatalog";

export const urls = (idJuego = ID_JUEGO_POKEMON) => ({
  priceGuide: `${BASE}/priceGuide/price_guide_${idJuego}.json`,
  catalogo: `${BASE}/productList/products_singles_${idJuego}.json`,
});

// Campos del Price Guide → columnas de la base de datos
const CAMPOS_PRECIO = {
  avg: "avg",
  low: "low",
  trend: "trend",
  avg1: "avg1",
  avg7: "avg7",
  avg30: "avg30",
  "avg-holo": "avg_holo",
  "low-holo": "low_holo",
  "trend-holo": "trend_holo",
  "avg7-holo": "avg7_holo",
  "avg30-holo": "avg30_holo",
};

const COLUMNAS_DIARIAS = [
  "avg", "low", "trend", "avg7", "avg30", "avg_holo", "trend_holo", "avg7_holo", "avg30_holo",
];

/** "2026-10-12T02:47:30+0200" → "2026-10-12" (fecha local de CardMarket, hora de París). */
export function fechaDePriceGuide(createdAt) {
  const m = /^(\d{4}-\d{2}-\d{2})T/.exec(createdAt ?? "");
  if (!m) throw new Error(`createdAt inesperado en el Price Guide: ${createdAt}`);
  return m[1];
}

function numero(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Entrada del Price Guide → { id_producto, avg, low, trend, ... } */
export function preciosDeEntrada(entrada) {
  const fila = { id_producto: entrada.idProduct };
  for (const [origen, destino] of Object.entries(CAMPOS_PRECIO)) {
    fila[destino] = numero(entrada[origen]);
  }
  return fila;
}

/**
 * Une catálogo y Price Guide en filas para la tabla `productos`.
 * Solo incluye productos del catálogo de cartas sueltas (el Price Guide también trae producto sellado).
 */
export function filasProductos(catalogo, priceGuide) {
  const fecha = fechaDePriceGuide(priceGuide.createdAt);
  const precios = new Map(priceGuide.priceGuides.map((e) => [e.idProduct, preciosDeEntrada(e)]));
  return catalogo.products.map((p) => {
    const precio = precios.get(p.idProduct);
    return {
      id_producto: p.idProduct,
      nombre: p.name,
      id_expansion: p.idExpansion ?? null,
      id_categoria: p.idCategory ?? null,
      id_metacarta: p.idMetacard ?? null,
      ...(precio ?? preciosDeEntrada({ idProduct: p.idProduct })),
      precio_fecha: precio ? fecha : null,
      actualizado: new Date().toISOString(),
    };
  });
}

/** Filas de `precios_diarios` para los productos indicados. */
export function filasPreciosDiarios(priceGuide, idsProducto) {
  const fecha = fechaDePriceGuide(priceGuide.createdAt);
  const ids = new Set(idsProducto);
  return priceGuide.priceGuides
    .filter((e) => ids.has(e.idProduct))
    .map((e) => {
      const p = preciosDeEntrada(e);
      const fila = { id_producto: p.id_producto, fecha };
      for (const c of COLUMNAS_DIARIAS) fila[c] = p[c];
      return fila;
    });
}

/**
 * Copia compacta del Price Guide completo para guardar en Storage:
 * columnas una vez y cada producto como array, para ocupar lo mínimo.
 */
export function snapshotCompacto(priceGuide) {
  const columnas = ["id_producto", ...Object.values(CAMPOS_PRECIO)];
  return {
    version: 1,
    createdAt: priceGuide.createdAt,
    fecha: fechaDePriceGuide(priceGuide.createdAt),
    columnas,
    filas: priceGuide.priceGuides.map((e) => {
      const p = preciosDeEntrada(e);
      return columnas.map((c) => p[c]);
    }),
  };
}

/** Busca el precio de un producto dentro de una copia compacta. */
export function precioEnSnapshot(snapshot, idProducto) {
  const fila = snapshot.filas.find((f) => f[0] === idProducto);
  if (!fila) return null;
  return Object.fromEntries(snapshot.columnas.map((c, i) => [c, fila[i]]));
}

export function trocear(lista, tam) {
  const trozos = [];
  for (let i = 0; i < lista.length; i += tam) trozos.push(lista.slice(i, i + tam));
  return trozos;
}
