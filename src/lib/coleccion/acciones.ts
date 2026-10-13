"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { clienteConSesion } from "@/lib/supabase/server";
import {
  ErrorFormulario,
  datosEjemplar,
  entero,
  fecha,
  idProducto,
  importe,
  texto,
} from "./formulario";
import type { ProductoBuscado } from "./tipos";

export type EstadoAccion = { error?: string; ok?: string };

function fallo(e: unknown): EstadoAccion {
  if (e instanceof ErrorFormulario) return { error: e.message };
  console.error(e);
  return { error: e instanceof Error ? e.message : "Algo ha fallado." };
}

function comprobar(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// ─── Buscador de cartas ────────────────────────────────────────────────────

export async function buscarProductos(consulta: string): Promise<ProductoBuscado[]> {
  const q = consulta.trim();
  if (q.length < 2) return [];
  const { supabase } = await clienteConSesion();
  const patron = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  const { data, error } = await supabase
    .from("productos")
    .select("id_producto, nombre, id_expansion, trend, trend_holo, imagen_url")
    .ilike("nombre", patron)
    .order("nombre")
    .limit(30);
  comprobar(error);
  return data ?? [];
}

// ─── Pedidos ───────────────────────────────────────────────────────────────

function datosPedido(datos: FormData) {
  const reparto = texto(datos, "reparto") ?? "iguales";
  if (reparto !== "iguales" && reparto !== "proporcional") throw new ErrorFormulario("Reparto no válido.");
  return {
    fecha: fecha(datos, "fecha"),
    vendedor: texto(datos, "vendedor"),
    plataforma: texto(datos, "plataforma") ?? "CardMarket",
    envio_total: importe(datos, "envio_total") ?? 0,
    otros_gastos: importe(datos, "otros_gastos") ?? 0,
    reparto,
    notas: texto(datos, "notas"),
  };
}

export async function crearPedido(_: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  let id: number;
  try {
    const { supabase } = await clienteConSesion();
    const { data, error } = await supabase.from("pedidos").insert(datosPedido(datos)).select("id").single();
    comprobar(error);
    id = data!.id;
  } catch (e) {
    return fallo(e);
  }
  redirect(`/pedidos/${id}`);
}

export async function actualizarPedido(id: number, _: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  try {
    const { supabase } = await clienteConSesion();
    const { error } = await supabase.from("pedidos").update(datosPedido(datos)).eq("id", id);
    comprobar(error);
  } catch (e) {
    return fallo(e);
  }
  refresh();
  return { ok: "Pedido guardado." };
}

export async function borrarPedido(id: number) {
  const { supabase } = await clienteConSesion();
  const { error } = await supabase.from("pedidos").delete().eq("id", id);
  comprobar(error);
  redirect("/pedidos");
}

// ─── Ejemplares ────────────────────────────────────────────────────────────

export async function anadirCartaAPedido(
  idPedido: number,
  _: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  try {
    const fila = {
      id_producto: idProducto(datos),
      origen: "pedido" as const,
      id_pedido: idPedido,
      precio_compra: importe(datos, "precio_compra", { obligatorio: true }),
      ...datosEjemplar(datos),
    };
    const cantidad = entero(datos, "cantidad");
    const { supabase } = await clienteConSesion();
    const { error } = await supabase.from("ejemplares").insert(Array.from({ length: cantidad }, () => fila));
    comprobar(error);
  } catch (e) {
    return fallo(e);
  }
  refresh();
  return { ok: "Carta añadida." };
}

export async function crearCartaDeSobre(_: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  try {
    const fila = {
      id_producto: idProducto(datos),
      origen: "sobre" as const,
      fecha_obtencion: fecha(datos, "fecha_obtencion"),
      ...datosEjemplar(datos),
    };
    const cantidad = entero(datos, "cantidad");
    const { supabase } = await clienteConSesion();
    const { error } = await supabase.from("ejemplares").insert(Array.from({ length: cantidad }, () => fila));
    comprobar(error);
  } catch (e) {
    return fallo(e);
  }
  redirect("/coleccion?origen=sobre");
}

export async function actualizarEjemplar(id: number, _: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  try {
    const { supabase } = await clienteConSesion();
    const { data: actual, error: errorLectura } = await supabase
      .from("ejemplares")
      .select("origen")
      .eq("id", id)
      .single();
    comprobar(errorLectura);
    const cambios =
      actual!.origen === "pedido"
        ? { ...datosEjemplar(datos), precio_compra: importe(datos, "precio_compra", { obligatorio: true }) }
        : { ...datosEjemplar(datos), fecha_obtencion: fecha(datos, "fecha_obtencion") };
    const { error } = await supabase.from("ejemplares").update(cambios).eq("id", id);
    comprobar(error);
  } catch (e) {
    return fallo(e);
  }
  refresh();
  return { ok: "Carta guardada." };
}

export async function borrarEjemplar(id: number, volverA: string) {
  const { supabase } = await clienteConSesion();
  const { error } = await supabase.from("ejemplares").delete().eq("id", id);
  comprobar(error);
  // Solo rutas internas de la app (evita "//otro-dominio")
  redirect(/^\/(coleccion|pedidos)(\/\d+)?$/.test(volverA) ? volverA : "/coleccion");
}

// ─── Imágenes ──────────────────────────────────────────────────────────────

export async function elegirImagen(idProducto: number, imagenUrl: string | null, tcgdexId: string | null) {
  const { supabase } = await clienteConSesion();
  const { error } = await supabase.rpc("elegir_imagen", {
    p_id_producto: idProducto,
    p_imagen_url: imagenUrl,
    p_tcgdex_id: tcgdexId,
  });
  comprobar(error);
  refresh();
}
