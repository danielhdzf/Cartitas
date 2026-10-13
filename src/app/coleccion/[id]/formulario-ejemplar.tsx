"use client";

import { useActionState } from "react";
import { actualizarEjemplar, type EstadoAccion } from "@/lib/coleccion/acciones";
import type { Ejemplar } from "@/lib/coleccion/tipos";
import { CamposEjemplar } from "@/components/campos-ejemplar";
import { Mensaje } from "@/components/mensaje";

export function FormularioEjemplar({ ejemplar }: { ejemplar: Ejemplar }) {
  const [estado, enviar, enviando] = useActionState<EstadoAccion, FormData>(
    actualizarEjemplar.bind(null, ejemplar.id),
    {},
  );
  return (
    <form action={enviar} className="flex flex-col gap-3">
      {ejemplar.origen === "pedido" ? (
        <label className="flex flex-col gap-1 text-sm text-apagado">
          Precio de compra (€)
          <input name="precio_compra" inputMode="decimal" required defaultValue={ejemplar.precio_compra ?? ""} className="campo text-texto" />
        </label>
      ) : (
        <label className="flex flex-col gap-1 text-sm text-apagado">
          Fecha en que la sacaste
          <input type="date" name="fecha_obtencion" required defaultValue={ejemplar.fecha_obtencion ?? ""} className="campo text-texto" />
        </label>
      )}
      <CamposEjemplar valores={ejemplar} />
      <button type="submit" disabled={enviando} className="boton self-start">
        {enviando ? "Guardando…" : "Guardar cambios"}
      </button>
      <Mensaje estado={estado} />
    </form>
  );
}
