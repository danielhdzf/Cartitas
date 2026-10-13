"use client";

import { useActionState } from "react";
import { crearCartaDeSobre, type EstadoAccion } from "@/lib/coleccion/acciones";
import { BuscadorCarta } from "@/components/buscador-carta";
import { CamposEjemplar } from "@/components/campos-ejemplar";
import { Mensaje } from "@/components/mensaje";
import { rellenarConHoy } from "@/lib/hoy";

export function FormularioSobre() {
  const [estado, enviar, enviando] = useActionState<EstadoAccion, FormData>(crearCartaDeSobre, {});
  return (
    <form action={enviar} className="flex flex-col gap-3">
      <BuscadorCarta />
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-apagado">
          Fecha en que la sacaste
          <input type="date" name="fecha_obtencion" required ref={(c) => rellenarConHoy(c, { limitar: true })} className="campo text-texto" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-apagado">
          Cantidad
          <input name="cantidad" type="number" min={1} max={99} defaultValue={1} className="campo text-texto" />
        </label>
      </div>
      <CamposEjemplar />
      <button type="submit" disabled={enviando} className="boton self-start">
        {enviando ? "Guardando…" : "Añadir a la colección"}
      </button>
      <Mensaje estado={estado} />
    </form>
  );
}
