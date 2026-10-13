import type { Metadata } from "next";
import { Suspense } from "react";
import { clienteConSesion } from "@/lib/supabase/server";
import { formatoEuros, formatoFecha } from "@/lib/formato";

export const metadata: Metadata = { title: "Buscar cartas" };

const MAX_RESULTADOS = 50;

export default function PaginaCartas({ searchParams }: PageProps<"/cartas">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
      <h1 className="text-2xl font-semibold">Buscar cartas</h1>
      <Suspense fallback={<p className="text-apagado">Cargando…</p>}>
        <Busqueda searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Busqueda({ searchParams }: Pick<PageProps<"/cartas">, "searchParams">) {
  const parametros = await searchParams;
  const texto = (Array.isArray(parametros.q) ? parametros.q[0] : parametros.q)?.trim() ?? "";

  return (
    <>
      <form className="flex gap-2" role="search">
        <input
          name="q"
          defaultValue={texto}
          placeholder="Nombre de la carta, p. ej. Leafeon"
          aria-label="Nombre de la carta"
          className="campo min-w-0 flex-1"
        />
        <button type="submit" className="boton">Buscar</button>
      </form>
      {texto.length >= 2 ? <Resultados texto={texto} /> : (
        <p className="text-apagado">Escribe al menos 2 letras.</p>
      )}
    </>
  );
}

async function Resultados({ texto }: { texto: string }) {
  const { supabase } = await clienteConSesion();
  const patron = `%${texto.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  const { data, error } = await supabase
    .from("productos")
    .select("id_producto, nombre, id_expansion, trend, avg30, trend_holo, precio_fecha")
    .ilike("nombre", patron)
    .order("nombre")
    .limit(MAX_RESULTADOS);

  if (error) return <p className="text-perdida">Error al buscar: {error.message}</p>;
  if (!data.length) return <p className="text-apagado">No hay cartas con ese nombre.</p>;

  return (
    <>
      <p className="text-sm text-apagado">
        {data.length === MAX_RESULTADOS ? `Primeros ${MAX_RESULTADOS} resultados` : `${data.length} resultados`}
      </p>
      <ul className="flex flex-col gap-2">
        {data.map((p) => (
          <li key={p.id_producto} className="tarjeta flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div className="min-w-0">
              <p className="font-medium">{p.nombre}</p>
              <p className="text-sm text-apagado">
                Producto {p.id_producto} · expansión {p.id_expansion ?? "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatoEuros(p.trend)}</p>
              <p className="text-sm text-apagado">
                media 30 días {formatoEuros(p.avg30)}
                {p.trend_holo !== null && <> · holo {formatoEuros(p.trend_holo)}</>}
              </p>
              <p className="text-xs text-apagado">{formatoFecha(p.precio_fecha)}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
