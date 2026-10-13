import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { clienteConSesion } from "@/lib/supabase/server";
import type { Ejemplar } from "@/lib/coleccion/tipos";
import { nombreIdioma } from "@/lib/coleccion/tipos";
import { formatoEuros, formatoFecha } from "@/lib/formato";
import { Beneficio } from "@/components/beneficio";
import { MiniaturaCarta } from "@/components/miniatura-carta";

export const metadata: Metadata = { title: "Colección" };

const FILTROS = [
  ["", "Todas"],
  ["pedido", "Compradas"],
  ["sobre", "De sobre"],
] as const;

export default function PaginaColeccion({ searchParams }: PageProps<"/coleccion">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Colección</h1>
        <div className="flex gap-2">
          <Link href="/pedidos/nuevo" className="rounded-lg border border-borde px-3 py-2 text-sm">Nuevo pedido</Link>
          <Link href="/coleccion/sobre" className="boton text-sm">Carta de sobre</Link>
        </div>
      </div>
      <Suspense fallback={<p className="text-apagado">Cargando…</p>}>
        <Lista searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Lista({ searchParams }: Pick<PageProps<"/coleccion">, "searchParams">) {
  const parametros = await searchParams;
  const origen = parametros.origen === "pedido" || parametros.origen === "sobre" ? parametros.origen : "";

  const { supabase } = await clienteConSesion();
  let consulta = supabase.from("ejemplares_resumen").select("*").order("fecha", { ascending: false }).order("id");
  if (origen) consulta = consulta.eq("origen", origen);
  const { data, error } = await consulta;
  if (error) return <p className="text-perdida">Error: {error.message}</p>;
  const cartas = (data ?? []) as Ejemplar[];

  const valor = cartas.reduce((s, c) => s + Number(c.valor_actual ?? 0), 0);

  return (
    <>
      <nav className="flex gap-2 text-sm" aria-label="Filtrar por origen">
        {FILTROS.map(([v, n]) => (
          <Link
            key={v}
            href={v ? `/coleccion?origen=${v}` : "/coleccion"}
            className={`rounded-full border px-3 py-1 ${origen === v ? "border-acento text-acento" : "border-borde text-apagado"}`}
          >
            {n}
          </Link>
        ))}
      </nav>
      <p className="text-sm text-apagado">
        {cartas.length} {cartas.length === 1 ? "carta" : "cartas"} · valor actual {formatoEuros(valor)}
      </p>
      {cartas.length === 0 && <p className="text-apagado">No hay cartas todavía.</p>}
      <ul className="flex flex-col gap-2">
        {cartas.map((c) => (
          <li key={c.id}>
            <Link href={`/coleccion/${c.id}`} className="tarjeta flex items-center gap-3 hover:border-acento">
              <MiniaturaCarta url={c.imagen_url} nombre={c.nombre} tam="s" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.nombre}</p>
                <p className="text-sm text-apagado">
                  {c.origen === "pedido" ? `Comprada el ${formatoFecha(c.fecha)}` : `De sobre, ${formatoFecha(c.fecha)}`}
                  {" "}· {nombreIdioma(c.idioma)}{c.es_holo && " · holo"}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold">{formatoEuros(c.valor_actual)}</p>
                {c.origen === "pedido" ? <Beneficio valor={c.beneficio} /> : <Beneficio valor={c.revalorizacion} />}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
