import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { borrarEjemplar } from "@/lib/coleccion/acciones";
import type { Ejemplar } from "@/lib/coleccion/tipos";
import { nombreIdioma } from "@/lib/coleccion/tipos";
import { clienteConSesion } from "@/lib/supabase/server";
import { formatoEuros, formatoFecha } from "@/lib/formato";
import { Beneficio } from "@/components/beneficio";
import { BotonBorrar } from "@/components/boton-borrar";
import { MiniaturaCarta } from "@/components/miniatura-carta";
import { FormularioEjemplar } from "./formulario-ejemplar";
import { SelectorImagen } from "./selector-imagen";

export const metadata: Metadata = { title: "Carta" };

export default function PaginaCarta({ params }: PageProps<"/coleccion/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
      <Link href="/coleccion" className="text-sm text-apagado">← Colección</Link>
      <Suspense fallback={<p className="text-apagado">Cargando…</p>}>
        <FichaCarta params={params} />
      </Suspense>
    </main>
  );
}

async function FichaCarta({ params }: Pick<PageProps<"/coleccion/[id]">, "params">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const { supabase } = await clienteConSesion();
  const { data } = await supabase.from("ejemplares_resumen").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const c = data as Ejemplar;
  const deSobre = c.origen === "sobre";

  return (
    <>
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="flex flex-col items-center gap-2 sm:w-56">
          <MiniaturaCarta url={c.imagen_url} nombre={c.nombre} tam="l" />
          <SelectorImagen idProducto={c.id_producto} nombre={c.nombre} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{c.nombre}</h1>
            <p className="text-apagado">
              {nombreIdioma(c.idioma)} · {c.estado}{c.es_holo && " · holo"} · producto {c.id_producto}
            </p>
          </div>
          <p>
            {deSobre ? (
              <>Sacada de un sobre el {formatoFecha(c.fecha)}</>
            ) : (
              <>
                Comprada el {formatoFecha(c.fecha)} en el{" "}
                <Link href={`/pedidos/${c.id_pedido}`} className="text-acento underline">
                  pedido de {c.vendedor ?? "sin vendedor"}
                </Link>
              </>
            )}
          </p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            {!deSobre && (
              <>
                <Fila titulo="Precio de compra" valor={formatoEuros(c.precio_compra)} />
                <Fila titulo="Envío asignado" valor={formatoEuros(c.envio_asignado)} />
                <Fila titulo="Coste total" valor={formatoEuros(c.coste_total)} />
              </>
            )}
            <Fila
              titulo={`Valor actual${c.precio_fecha ? ` (${formatoFecha(c.precio_fecha)})` : ""}`}
              valor={formatoEuros(c.valor_actual)}
            />
            {!deSobre && (
              <div>
                <dt className="text-sm text-apagado">Beneficio</dt>
                <dd className="font-semibold"><Beneficio valor={c.beneficio} pct={c.beneficio_pct} /></dd>
              </div>
            )}
            <Fila
              titulo="Valor al obtenerla"
              valor={c.valor_referencia === null ? "Pendiente" : `${formatoEuros(c.valor_referencia)} (${c.fuente_valor})`}
            />
            {c.revalorizacion !== null && (
              <div>
                <dt className="text-sm text-apagado">Revalorización</dt>
                <dd className="font-semibold"><Beneficio valor={c.revalorizacion} /></dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <details className="tarjeta">
        <summary className="cursor-pointer font-semibold">Editar carta</summary>
        <div className="mt-3">
          <FormularioEjemplar ejemplar={c} />
        </div>
      </details>

      <BotonBorrar
        accion={borrarEjemplar.bind(null, c.id, deSobre ? "/coleccion" : `/pedidos/${c.id_pedido}`)}
        pregunta="¿Borrar esta carta de tu colección?"
        texto="Borrar carta"
      />
    </>
  );
}

function Fila({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-sm text-apagado">{titulo}</dt>
      <dd className="font-semibold">{valor}</dd>
    </div>
  );
}
