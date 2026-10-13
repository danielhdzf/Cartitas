#!/usr/bin/env node
// Proceso nocturno: descarga el Price Guide y el catálogo de CardMarket,
// actualiza `productos`, guarda la copia completa del día en Storage
// y apunta en `precios_diarios` el precio de los productos que hay en la colección.
//
// Uso:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/sync-precios.mjs [--force]

import { gzipSync } from "node:zlib";
import { createClient } from "@supabase/supabase-js";
import {
  fechaDePriceGuide,
  filasPreciosDiarios,
  filasProductos,
  snapshotCompacto,
  trocear,
  urls,
} from "./lib/cardmarket.mjs";

const TAM_LOTE = 1000;
const forzar = process.argv.includes("--force");

function variable(nombre) {
  const v = process.env[nombre];
  if (!v) throw new Error(`Falta la variable de entorno ${nombre}`);
  return v;
}

async function descargarJson(url) {
  const res = await fetch(url, { headers: { "user-agent": "Cartitas (coleccion personal)" } });
  if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
  return res.json();
}

async function comprobar({ error }, que) {
  if (error) throw new Error(`${que}: ${error.message}`);
}

async function main() {
  const supabase = createClient(variable("SUPABASE_URL"), variable("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  const { priceGuide: urlPrecios, catalogo: urlCatalogo } = urls();
  console.log("Descargando Price Guide…");
  const priceGuide = await descargarJson(urlPrecios);
  const fecha = fechaDePriceGuide(priceGuide.createdAt);
  console.log(`Price Guide del ${fecha}: ${priceGuide.priceGuides.length} precios`);

  const { data: yaHecha } = await supabase
    .from("sincronizaciones")
    .select("fecha_precios")
    .eq("fecha_precios", fecha)
    .maybeSingle();
  if (yaHecha && !forzar) {
    console.log("Este Price Guide ya estaba guardado. Nada que hacer (usa --force para repetir).");
    return;
  }

  console.log("Descargando catálogo…");
  const catalogo = await descargarJson(urlCatalogo);

  // 1. Productos con su último precio
  const productos = filasProductos(catalogo, priceGuide);
  for (const [i, lote] of trocear(productos, TAM_LOTE).entries()) {
    await comprobar(
      await supabase.from("productos").upsert(lote, { onConflict: "id_producto" }),
      `Guardando productos (lote ${i + 1})`,
    );
  }
  console.log(`Productos actualizados: ${productos.length}`);

  // 2. Copia completa del día en Storage
  const ruta = `${fecha}.json.gz`;
  const comprimido = gzipSync(JSON.stringify(snapshotCompacto(priceGuide)));
  await comprobar(
    await supabase.storage.from("snapshots").upload(ruta, comprimido, {
      contentType: "application/gzip",
      upsert: true,
    }),
    "Subiendo la copia del día",
  );
  console.log(`Copia guardada: snapshots/${ruta} (${(comprimido.length / 1e6).toFixed(2)} MB)`);

  // 3. Precio del día de los productos que hay en alguna colección
  const ids = [];
  for (let desde = 0; ; desde += TAM_LOTE) {
    const { data, error } = await supabase
      .from("productos_en_coleccion")
      .select("id_producto")
      .order("id_producto")
      .range(desde, desde + TAM_LOTE - 1);
    if (error) throw new Error(`Leyendo la colección: ${error.message}`);
    ids.push(...data.map((e) => e.id_producto));
    if (data.length < TAM_LOTE) break;
  }
  const diarios = filasPreciosDiarios(priceGuide, ids);
  for (const lote of trocear(diarios, TAM_LOTE)) {
    await comprobar(
      await supabase.from("precios_diarios").upsert(lote, { onConflict: "id_producto,fecha" }),
      "Guardando precios diarios",
    );
  }
  console.log(`Precios diarios guardados: ${diarios.length}`);

  await comprobar(
    await supabase.from("sincronizaciones").upsert({
      fecha_precios: fecha,
      creado_cardmarket: priceGuide.createdAt,
      productos: productos.length,
      precios: priceGuide.priceGuides.length,
      snapshot_ruta: ruta,
      ejecutado: new Date().toISOString(),
    }),
    "Registrando la sincronización",
  );
  console.log("Listo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
