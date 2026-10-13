import { Suspense } from "react";
import Link from "next/link";
import { clienteConSesion } from "@/lib/supabase/server";
import type { Ejemplar, Pedido } from "@/lib/coleccion/tipos";
import { formatoEuros, formatoFecha } from "@/lib/formato";
import { Beneficio } from "@/components/beneficio";
import { cerrarSesion } from "./login/acciones";

export default function Inicio() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Tu colección</h1>
      <Suspense fallback={<p className="text-apagado">Cargando…</p>}>
        <Resumen />
      </Suspense>
    </main>
  );
}

const suma = (lista: (number | null)[]) => lista.reduce<number>((s, v) => s + Number(v ?? 0), 0);

async function Resumen() {
  const { supabase, usuario } = await clienteConSesion();
  const [{ data: ultima }, { data: pedidos }, { data: ejemplares }] = await Promise.all([
    supabase
      .from("sincronizaciones")
      .select("fecha_precios")
      .order("fecha_precios", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("pedidos_resumen").select("coste_total, valor_actual"),
    supabase.from("ejemplares_resumen").select("origen, valor_actual, revalorizacion"),
  ]);

  const compras = (pedidos ?? []) as Pick<Pedido, "coste_total" | "valor_actual">[];
  const cartas = (ejemplares ?? []) as Pick<Ejemplar, "origen" | "valor_actual" | "revalorizacion">[];
  const deSobre = cartas.filter((c) => c.origen === "sobre");
  const invertido = suma(compras.map((p) => p.coste_total));
  const valorCompras = suma(compras.map((p) => p.valor_actual));
  const valorSobres = suma(deSobre.map((c) => c.valor_actual));

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="tarjeta">
          <p className="text-sm text-apagado">Invertido en pedidos</p>
          <p className="text-2xl font-semibold">{formatoEuros(invertido)}</p>
        </div>
        <div className="tarjeta">
          <p className="text-sm text-apagado">Valor actual de lo comprado</p>
          <p className="text-2xl font-semibold">{formatoEuros(valorCompras)}</p>
          <p className="text-sm"><Beneficio valor={compras.length ? valorCompras - invertido : null} /></p>
        </div>
        <div className="tarjeta">
          <p className="text-sm text-apagado">Valor de cartas de sobre</p>
          <p className="text-2xl font-semibold">{formatoEuros(valorSobres)}</p>
          <p className="text-sm text-apagado">{deSobre.length} {deSobre.length === 1 ? "carta" : "cartas"}</p>
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        <Link href="/coleccion" className="boton">Ver colección ({cartas.length})</Link>
        <Link href="/pedidos/nuevo" className="rounded-lg border border-borde px-4 py-2">Nuevo pedido</Link>
        <Link href="/coleccion/sobre" className="rounded-lg border border-borde px-4 py-2">Carta de sobre</Link>
      </div>
      <p className="text-sm text-apagado">
        Precios de CardMarket del {ultima ? formatoFecha(ultima.fecha_precios) : "— (aún no se ha ejecutado el proceso nocturno)"}.
      </p>
      <form action={cerrarSesion} className="text-sm text-apagado">
        {usuario.email} · <button type="submit" className="underline">Salir</button>
      </form>
    </>
  );
}
