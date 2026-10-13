import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { clienteConSesion } from "@/lib/supabase/server";
import type { Pedido } from "@/lib/coleccion/tipos";
import { formatoEuros, formatoFecha } from "@/lib/formato";
import { Beneficio } from "@/components/beneficio";

export const metadata: Metadata = { title: "Pedidos" };

export default function PaginaPedidos() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        <Link href="/pedidos/nuevo" className="boton">Nuevo pedido</Link>
      </div>
      <Suspense fallback={<p className="text-apagado">Cargando…</p>}>
        <ListaPedidos />
      </Suspense>
    </main>
  );
}

async function ListaPedidos() {
  const { supabase } = await clienteConSesion();
  const { data, error } = await supabase
    .from("pedidos_resumen")
    .select("*")
    .order("fecha", { ascending: false })
    .order("id", { ascending: false });
  if (error) return <p className="text-perdida">Error: {error.message}</p>;
  const pedidos = (data ?? []) as Pedido[];
  if (!pedidos.length) return <p className="text-apagado">Todavía no has registrado ningún pedido.</p>;

  return (
    <ul className="flex flex-col gap-2">
      {pedidos.map((p) => (
        <li key={p.id}>
          <Link href={`/pedidos/${p.id}`} className="tarjeta flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 hover:border-acento">
            <div>
              <p className="font-medium">{formatoFecha(p.fecha)} · {p.vendedor ?? "Sin vendedor"}</p>
              <p className="text-sm text-apagado">
                {p.cartas} {p.cartas === 1 ? "carta" : "cartas"} · envío {formatoEuros(p.envio_total)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatoEuros(p.coste_total)}</p>
              <p className="text-sm"><Beneficio valor={p.beneficio} /></p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
