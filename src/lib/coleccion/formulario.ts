// Lectura y validación de los datos de los formularios.

import { ESTADOS, IDIOMAS } from "./tipos";

export class ErrorFormulario extends Error {}

export function texto(datos: FormData, campo: string) {
  const v = String(datos.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

/** Número decimal aceptando coma o punto ("7,70" o "7.70"). */
export function importe(datos: FormData, campo: string, { obligatorio = false } = {}) {
  const v = texto(datos, campo);
  if (v === null) {
    if (obligatorio) throw new ErrorFormulario(`Falta ${campo.replace("_", " ")}.`);
    return null;
  }
  const n = Number(v.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) throw new ErrorFormulario(`«${v}» no es un importe válido.`);
  return Math.round(n * 100) / 100;
}

export function entero(datos: FormData, campo: string, { min = 1, max = 99 } = {}) {
  const n = Number(texto(datos, campo) ?? min);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new ErrorFormulario(`La cantidad tiene que estar entre ${min} y ${max}.`);
  }
  return n;
}

export function fecha(datos: FormData, campo: string) {
  const v = texto(datos, campo);
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new ErrorFormulario("Pon una fecha válida.");
  return v;
}

export function idProducto(datos: FormData) {
  const n = Number(texto(datos, "id_producto"));
  if (!Number.isInteger(n) || n <= 0) throw new ErrorFormulario("Elige una carta del buscador.");
  return n;
}

/** Campos comunes de un ejemplar: idioma, estado y holo. */
export function datosEjemplar(datos: FormData) {
  const idioma = texto(datos, "idioma") ?? "JP";
  const estado = texto(datos, "estado") ?? "NM";
  if (!IDIOMAS.some(([c]) => c === idioma)) throw new ErrorFormulario("Idioma no válido.");
  if (!ESTADOS.some(([c]) => c === estado)) throw new ErrorFormulario("Estado no válido.");
  return { idioma, estado, es_holo: datos.get("es_holo") === "on", notas: texto(datos, "notas") };
}
