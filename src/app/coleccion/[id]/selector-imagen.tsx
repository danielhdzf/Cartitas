"use client";

/* eslint-disable @next/next/no-img-element -- miniaturas de TCGdex */

import { useState, useTransition } from "react";
import { elegirImagen } from "@/lib/coleccion/acciones";

type CartaTcgdex = { id: string; localId: string; name: string; image?: string };

const API = "https://api.tcgdex.net/v2";
const IDIOMAS = [
  ["ja", "Japonés"],
  ["en", "Inglés"],
  ["es", "Español"],
] as const;

/** "s12a 210", "S12a-210" o "sv8a-218" → id de carta de TCGdex. */
function comoIdDeCarta(texto: string) {
  const m = /^([a-z]{1,3}\d+[a-z]?)[\s-]+(\d{1,3})$/i.exec(texto.trim());
  return m ? `${m[1]}-${m[2].padStart(3, "0")}` : null;
}

async function buscarEnTcgdex(texto: string, idioma: string): Promise<CartaTcgdex[]> {
  const id = comoIdDeCarta(texto);
  if (id) {
    // TCGdex respeta mayúsculas en los ids de set; se prueban las variantes habituales
    for (const candidato of new Set([id, id.charAt(0).toUpperCase() + id.slice(1), id.toUpperCase(), id.toLowerCase()])) {
      const r = await fetch(`${API}/${idioma}/cards/${encodeURIComponent(candidato)}`);
      if (r.ok) return [await r.json()];
    }
  }
  const r = await fetch(`${API}/${idioma}/cards?name=${encodeURIComponent(texto.trim())}`);
  if (!r.ok) throw new Error(`TCGdex respondió ${r.status}`);
  return r.json();
}

export function SelectorImagen({ idProducto, nombre }: { idProducto: number; nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState(nombre.replace(/\s*\[.*\]\s*$/, "").replace(/\s*\(.*\)\s*$/, ""));
  const [idioma, setIdioma] = useState<string>("ja");
  const [resultados, setResultados] = useState<CartaTcgdex[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urlManual, setUrlManual] = useState("");
  const [cargando, startTransition] = useTransition();

  function buscar() {
    setError(null);
    startTransition(async () => {
      try {
        const cartas = await buscarEnTcgdex(texto, idioma);
        setResultados(cartas.filter((c) => c.image).slice(0, 60));
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo buscar en TCGdex.");
        setResultados(null);
      }
    });
  }

  function elegir(url: string | null, tcgdexId: string | null) {
    startTransition(async () => {
      await elegirImagen(idProducto, url, tcgdexId);
      setAbierto(false);
    });
  }

  if (!abierto) {
    return (
      <button type="button" className="text-sm text-acento underline" onClick={() => setAbierto(true)}>
        Elegir imagen
      </button>
    );
  }

  return (
    <div className="tarjeta flex flex-col gap-3">
      <p className="text-sm text-apagado">
        Busca en TCGdex por nombre o por código de set y número (p. ej. <code>S12a-210</code>). Para cartas japonesas
        el nombre tiene que ir en japonés, así que suele ser más fácil el código.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              buscar();
            }
          }}
          aria-label="Nombre o código de la carta"
          className="campo min-w-0 flex-1"
        />
        <select value={idioma} onChange={(e) => setIdioma(e.target.value)} aria-label="Idioma" className="campo">
          {IDIOMAS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
        </select>
        <button type="button" onClick={buscar} disabled={cargando} className="boton">Buscar</button>
      </div>
      {error && <p className="text-sm text-perdida">{error}</p>}
      {resultados && resultados.length === 0 && <p className="text-sm text-apagado">Sin resultados.</p>}
      {resultados && resultados.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {resultados.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                disabled={cargando}
                onClick={() => elegir(`${c.image}/high.webp`, c.id)}
                className="flex w-full flex-col gap-1 text-left text-xs hover:opacity-80"
              >
                <img src={`${c.image}/low.webp`} alt={c.name} loading="lazy" className="aspect-[5/7] w-full rounded-md border border-borde object-cover" />
                <span className="truncate">{c.name}</span>
                <span className="text-apagado">{c.id}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <details className="text-sm">
        <summary className="cursor-pointer text-apagado">Pegar una URL de imagen</summary>
        <div className="mt-2 flex gap-2">
          <input value={urlManual} onChange={(e) => setUrlManual(e.target.value)} placeholder="https://…" className="campo min-w-0 flex-1" />
          <button type="button" className="boton" disabled={!urlManual.startsWith("https://") || cargando} onClick={() => elegir(urlManual, null)}>
            Usar
          </button>
        </div>
      </details>
      <div className="flex gap-4 text-sm">
        <button type="button" className="text-apagado underline" onClick={() => setAbierto(false)}>Cancelar</button>
        <button type="button" className="text-perdida underline" onClick={() => elegir(null, null)}>Quitar imagen</button>
      </div>
    </div>
  );
}
