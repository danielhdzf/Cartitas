/** Fecha de hoy en formato AAAA-MM-DD, en la hora local del navegador. */
export function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Ref para un <input type="date"> que, si está vacío, se rellena con hoy al montarse.
 * Se hace en el navegador para que la página pueda prerenderizarse sin fecha fija.
 */
export function rellenarConHoy(campo: HTMLInputElement | null, { limitar = false } = {}) {
  if (!campo) return;
  if (!campo.value) campo.value = hoy();
  if (limitar) campo.max = hoy();
}
