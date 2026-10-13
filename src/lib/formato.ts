const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const fechas = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

export function formatoEuros(valor: number | string | null | undefined) {
  if (valor === null || valor === undefined || valor === "") return "—";
  return euros.format(Number(valor));
}

/** "2026-10-12" → "12/10/2026" */
export function formatoFecha(fecha: string | null | undefined) {
  if (!fecha) return "—";
  return fechas.format(new Date(`${fecha.slice(0, 10)}T00:00:00Z`));
}
