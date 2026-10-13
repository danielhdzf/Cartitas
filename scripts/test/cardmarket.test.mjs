import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fechaDePriceGuide,
  filasPreciosDiarios,
  filasProductos,
  precioEnSnapshot,
  snapshotCompacto,
  trocear,
} from "../lib/cardmarket.mjs";

// Muestra con la forma real de los ficheros de CardMarket (12/10/2026)
const priceGuide = {
  version: 1,
  createdAt: "2026-10-12T02:47:30+0200",
  priceGuides: [
    { idProduct: 100, idCategory: 51, avg: 31.5, low: 25, trend: 31.02, avg1: null, avg7: 30.8, avg30: 29.9,
      "avg-holo": null, "low-holo": null, "trend-holo": null, "avg1-holo": null, "avg7-holo": null, "avg30-holo": null },
    { idProduct: 200, idCategory: 51, avg: 10, low: 8, trend: 10.34, avg1: 10, avg7: 10.1, avg30: 9.8,
      "avg-holo": 12, "low-holo": 11, "trend-holo": 12.5, "avg1-holo": null, "avg7-holo": 12.2, "avg30-holo": 12 },
    { idProduct: 999, idCategory: 52, avg: 149, low: 150, trend: 279.1 }, // producto sellado
  ],
};
const catalogo = {
  version: 1,
  createdAt: "2026-10-11T12:18:12+0200",
  products: [
    { idProduct: 100, name: "Reshiram & Charizard GX", idCategory: 51, idExpansion: 7, idMetacard: 1 },
    { idProduct: 200, name: "Leafeon VSTAR", idCategory: 51, idExpansion: 8, idMetacard: 2 },
    { idProduct: 300, name: "Sin precio", idCategory: 51, idExpansion: 8, idMetacard: 3 },
  ],
};

test("la fecha sale del createdAt en hora de París", () => {
  assert.equal(fechaDePriceGuide("2026-10-12T02:47:30+0200"), "2026-10-12");
  assert.throws(() => fechaDePriceGuide("ayer"));
});

test("productos: une catálogo y precios, sin producto sellado", () => {
  const filas = filasProductos(catalogo, priceGuide);
  assert.equal(filas.length, 3);
  const leafeon = filas.find((f) => f.id_producto === 200);
  assert.equal(leafeon.nombre, "Leafeon VSTAR");
  assert.equal(leafeon.trend, 10.34);
  assert.equal(leafeon.trend_holo, 12.5);
  assert.equal(leafeon.precio_fecha, "2026-10-12");
  const sinPrecio = filas.find((f) => f.id_producto === 300);
  assert.equal(sinPrecio.trend, null);
  assert.equal(sinPrecio.precio_fecha, null);
  assert.ok(!filas.some((f) => f.id_producto === 999));
});

test("precios diarios: solo los productos de la colección", () => {
  const filas = filasPreciosDiarios(priceGuide, [200]);
  assert.deepEqual(filas, [{
    id_producto: 200, fecha: "2026-10-12", avg: 10, low: 8, trend: 10.34, avg7: 10.1, avg30: 9.8,
    avg_holo: 12, trend_holo: 12.5, avg7_holo: 12.2, avg30_holo: 12,
  }]);
});

test("la copia compacta conserva todos los precios", () => {
  const snap = snapshotCompacto(priceGuide);
  assert.equal(snap.fecha, "2026-10-12");
  assert.equal(snap.filas.length, 3);
  const p = precioEnSnapshot(JSON.parse(JSON.stringify(snap)), 999);
  assert.equal(p.trend, 279.1);
  assert.equal(p.avg_holo, null);
  assert.equal(precioEnSnapshot(snap, 12345), null);
});

test("trocear en lotes", () => {
  assert.deepEqual(trocear([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
});
