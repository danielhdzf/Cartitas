"use client";

import { useActionState, useState } from "react";
import { anadirCartaAPedido, type EstadoAccion } from "@/lib/coleccion/acciones";
import { BuscadorCarta } from "@/components/buscador-carta";
import { CamposEjemplar } from "@/components/campos-ejemplar";
import { Mensaje } from "@/components/mensaje";

export function FormularioCartaPedido({ idPedido }: { idPedido: number }) {
  // Tras añadir una carta, el buscador vuelve a empezar
  const [vuelta, setVuelta] = useState(0);
  const [estado, enviar, enviando] = useActionState<EstadoAccion, FormData>(async (anterior, datos) => {
    const resultado = await anadirCartaAPedido(idPedido, anterior, datos);
    if (resultado.ok) setVuelta((v) => v + 1);
    return resultado;
  }, {});

  return (
    <form action={enviar} className="flex flex-col gap-3">
      <BuscadorCarta key={vuelta} />
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-apagado">
          Precio por carta (€)
          <input name="precio_compra" inputMode="decimal" required placeholder="0,00" className="campo text-texto" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-apagado">
          Cantidad
          <input name="cantidad" type="number" min={1} max={99} defaultValue={1} className="campo text-texto" />
        </label>
      </div>
      <CamposEjemplar />
      <button type="submit" disabled={enviando} className="boton self-start">
        {enviando ? "Añadiendo…" : "Añadir al pedido"}
      </button>
      <Mensaje estado={estado} />
    </form>
  );
}
