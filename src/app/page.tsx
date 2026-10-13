import { Suspense } from "react";
import Link from "next/link";
import { clienteConSesion } from "@/lib/supabase/server";
import { formatoFecha } from "@/lib/formato";
import { cerrarSesion } from "./login/acciones";

export default function Inicio() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Tu colección</h1>
      <Suspense fallback={<p className="text-apagado">Cargando…</p>}>
        <Estado />
      </Suspense>
    </main>
  );
}

async function Estado() {
  const { supabase, usuario } = await clienteConSesion();
  const [{ data: ultima }, { count: productos }, { count: ejemplares }] = await Promise.all([
    supabase
      .from("sincronizaciones")
      .select("fecha_precios, ejecutado")
      .order("fecha_precios", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("productos").select("*", { count: "exact", head: true }),
    supabase.from("ejemplares").select("*", { count: "exact", head: true }),
  ]);

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="tarjeta">
          <p className="text-sm text-apagado">Cartas en tu colección</p>
          <p className="text-2xl font-semibold">{ejemplares ?? 0}</p>
        </div>
        <div className="tarjeta">
          <p className="text-sm text-apagado">Cartas en el catálogo</p>
          <p className="text-2xl font-semibold">{(productos ?? 0).toLocaleString("es-ES")}</p>
        </div>
        <div className="tarjeta">
          <p className="text-sm text-apagado">Precios de CardMarket del</p>
          <p className="text-2xl font-semibold">{ultima ? formatoFecha(ultima.fecha_precios) : "Aún no hay"}</p>
        </div>
      </section>
      <p className="text-apagado">
        Pedidos y cartas de sobre llegan en la siguiente fase. De momento puedes{" "}
        <Link href="/cartas" className="text-acento underline">buscar cartas y ver su precio</Link>.
      </p>
      <form action={cerrarSesion} className="text-sm text-apagado">
        {usuario.email} · <button type="submit" className="underline">Salir</button>
      </form>
    </>
  );
}
