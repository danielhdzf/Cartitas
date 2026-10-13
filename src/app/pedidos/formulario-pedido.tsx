"use client";

import { useActionState } from "react";
import type { EstadoAccion } from "@/lib/coleccion/acciones";
import type { Pedido } from "@/lib/coleccion/tipos";
import { Mensaje } from "@/components/mensaje";
import { rellenarConHoy } from "@/lib/hoy";

type Accion = (estado: EstadoAccion, datos: FormData) => Promise<EstadoAccion>;

export function FormularioPedido({ accion, pedido, textoBoton }: { accion: Accion; pedido?: Pedido; textoBoton: string }) {
  const [estado, enviar, enviando] = useActionState(accion, {});

  return (
    <form action={enviar} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-apagado">
          Fecha de compra
          <input type="date" name="fecha" required defaultValue={pedido?.fecha} ref={(c) => rellenarConHoy(c)} className="campo text-texto" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-apagado">
          Vendedor
          <input name="vendedor" defaultValue={pedido?.vendedor ?? ""} className="campo text-texto" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-apagado">
          Envío total (€)
          <input name="envio_total" inputMode="decimal" defaultValue={pedido?.envio_total ?? ""} placeholder="0,00" className="campo text-texto" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-apagado">
          Otros gastos (€)
          <input name="otros_gastos" inputMode="decimal" defaultValue={pedido?.otros_gastos ?? ""} placeholder="Tasas, seguro…" className="campo text-texto" />
        </label>
      </div>
      <fieldset className="flex flex-col gap-1 text-sm">
        <legend className="mb-1 text-apagado">Repartir el envío entre las cartas</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="reparto" value="iguales" defaultChecked={(pedido?.reparto ?? "iguales") === "iguales"} />
          A partes iguales
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="reparto" value="proporcional" defaultChecked={pedido?.reparto === "proporcional"} />
          Proporcional al precio de cada carta
        </label>
      </fieldset>
      <label className="flex flex-col gap-1 text-sm text-apagado">
        Plataforma
        <input name="plataforma" defaultValue={pedido?.plataforma ?? "CardMarket"} className="campo text-texto" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-apagado">
        Notas
        <input name="notas" defaultValue={pedido?.notas ?? ""} className="campo text-texto" />
      </label>
      <button type="submit" disabled={enviando} className="boton self-start">
        {enviando ? "Guardando…" : textoBoton}
      </button>
      <Mensaje estado={estado} />
    </form>
  );
}
