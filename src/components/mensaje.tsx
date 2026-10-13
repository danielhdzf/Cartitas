import type { EstadoAccion } from "@/lib/coleccion/acciones";

export function Mensaje({ estado }: { estado: EstadoAccion }) {
  if (estado.error) return <p role="alert" className="text-sm text-perdida">{estado.error}</p>;
  if (estado.ok) return <p role="status" className="text-sm text-ganancia">{estado.ok}</p>;
  return null;
}
