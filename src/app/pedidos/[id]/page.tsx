import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { actualizarPedido, borrarPedido } from "@/lib/coleccion/acciones";
import type { Ejemplar, Pedido } from "@/lib/coleccion/tipos";
import { nombreIdioma } from "@/lib/coleccion/tipos";
import { clienteConSesion } from "@/lib/supabase/server";
import { formatoEuros, formatoFecha } from "@/lib/formato";
import { Beneficio } from "@/components/beneficio";
import { BotonBorrar } from "@/components/boton-borrar";
import { MiniaturaCarta } from "@/components/miniatura-carta";
import { FormularioPedido } from "../formulario-pedido";
import { FormularioCartaPedido } from "./formulario-carta";

export const metadata: Metadata = { title: "Pedido" };

export default function PaginaPedido({ params }: PageProps<"/pedidos/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
      <Link href="/pedidos" className="text-sm text-apagado">← Pedidos</Link>
      <Suspense fallback={<p className="text-apagado">Cargando…</p>}>
        <DetallePedido params={params} />
      </Suspense>
    </main>
  );
}

async function DetallePedido({ params }: Pick<PageProps<"/pedidos/[id]">, "params">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const { supabase } = await clienteConSesion();
  const [{ data: pedido }, { data: filas }] = await Promise.all([
    supabase.from("pedidos_resumen").select("*").eq("id", id).maybeSingle(),
    supabase.from("ejemplares_resumen").select("*").eq("id_pedido", id).order("id"),
  ]);
  if (!pedido) notFound();
  const p = pedido as Pedido;
  const cartas = (filas ?? []) as Ejemplar[];

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Pedido del {formatoFecha(p.fecha)}</h1>
        <p className="text-apagado">
          {p.vendedor ?? "Sin vendedor"} · {p.plataforma} · envío {formatoEuros(p.envio_total)}
          {Number(p.otros_gastos) > 0 && <> + otros gastos {formatoEuros(p.otros_gastos)}</>}
          {" "}· reparto {p.reparto === "iguales" ? "a partes iguales" : "proporcional al precio"}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Dato titulo="Cartas" valor={String(p.cartas)} />
        <Dato titulo="Coste total" valor={formatoEuros(p.coste_total)} />
        <Dato titulo="Valor actual" valor={formatoEuros(p.valor_actual)} />
        <div className="tarjeta">
          <p className="text-sm text-apagado">Beneficio</p>
          <p className="text-xl font-semibold"><Beneficio valor={p.beneficio} /></p>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Cartas del pedido</h2>
        {cartas.length === 0 && <p className="text-apagado">Este pedido aún no tiene cartas.</p>}
        <ul className="flex flex-col gap-2">
          {cartas.map((c) => (
            <li key={c.id}>
              <Link href={`/coleccion/${c.id}`} className="tarjeta flex items-center gap-3 hover:border-acento">
                <MiniaturaCarta url={c.imagen_url} nombre={c.nombre} tam="s" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.nombre}</p>
                  <p className="text-sm text-apagado">
                    {nombreIdioma(c.idioma)} · {c.estado}{c.es_holo && " · holo"} · compra {formatoEuros(c.precio_compra)} + envío {formatoEuros(c.envio_asignado)}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">{formatoEuros(c.valor_actual)}</p>
                  <Beneficio valor={c.beneficio} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="tarjeta flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Añadir carta</h2>
        <FormularioCartaPedido idPedido={id} />
      </section>

      <details className="tarjeta">
        <summary className="cursor-pointer font-semibold">Editar datos del pedido</summary>
        <div className="mt-3">
          <FormularioPedido accion={actualizarPedido.bind(null, id)} pedido={p} textoBoton="Guardar cambios" />
        </div>
      </details>

      <BotonBorrar
        accion={borrarPedido.bind(null, id)}
        pregunta="¿Borrar este pedido y todas sus cartas?"
        texto="Borrar pedido"
      />
    </>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="tarjeta">
      <p className="text-sm text-apagado">{titulo}</p>
      <p className="text-xl font-semibold">{valor}</p>
    </div>
  );
}
