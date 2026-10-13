"use client";

import { useEffect, useState, useTransition } from "react";
import { buscarProductos } from "@/lib/coleccion/acciones";
import type { ProductoBuscado } from "@/lib/coleccion/tipos";
import { formatoEuros } from "@/lib/formato";
import { MiniaturaCarta } from "./miniatura-carta";

/** Busca una carta del catálogo de CardMarket y deja su id en un campo oculto `id_producto`. */
export function BuscadorCarta() {
  const [consulta, setConsulta] = useState("");
  const [resultados, setResultados] = useState<ProductoBuscado[]>([]);
  const [elegida, setElegida] = useState<ProductoBuscado | null>(null);
  const [buscando, startTransition] = useTransition();

  useEffect(() => {
    if (elegida || consulta.trim().length < 2) return;
    const temporizador = setTimeout(() => {
      startTransition(async () => setResultados(await buscarProductos(consulta)));
    }, 300);
    return () => clearTimeout(temporizador);
  }, [consulta, elegida]);

  if (elegida) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-acento p-2">
        <input type="hidden" name="id_producto" value={elegida.id_producto} />
        <MiniaturaCarta url={elegida.imagen_url} nombre={elegida.nombre} tam="s" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{elegida.nombre}</p>
          <p className="text-sm text-apagado">
            Producto {elegida.id_producto} · {formatoEuros(elegida.trend)}
          </p>
        </div>
        <button type="button" className="text-sm text-acento underline" onClick={() => setElegida(null)}>
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="search"
        value={consulta}
        onChange={(e) => setConsulta(e.target.value)}
        placeholder="Busca la carta por nombre, p. ej. Leafeon"
        aria-label="Buscar carta"
        className="campo"
      />
      {consulta.trim().length >= 2 && (
        <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto" aria-busy={buscando}>
          {!buscando && resultados.length === 0 && (
            <li className="text-sm text-apagado">No hay cartas con ese nombre.</li>
          )}
          {resultados.map((p) => (
            <li key={p.id_producto}>
              <button
                type="button"
                onClick={() => setElegida(p)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-fondo"
              >
                <MiniaturaCarta url={p.imagen_url} nombre={p.nombre} tam="s" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{p.nombre}</span>
                  <span className="block text-sm text-apagado">
                    Producto {p.id_producto} · expansión {p.id_expansion ?? "—"}
                  </span>
                </span>
                <span className="text-sm font-medium">{formatoEuros(p.trend)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
