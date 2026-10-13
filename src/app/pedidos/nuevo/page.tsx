import type { Metadata } from "next";
import Link from "next/link";
import { crearPedido } from "@/lib/coleccion/acciones";
import { FormularioPedido } from "../formulario-pedido";

export const metadata: Metadata = { title: "Nuevo pedido" };

export default function NuevoPedido() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
      <Link href="/pedidos" className="text-sm text-apagado">← Pedidos</Link>
      <h1 className="text-2xl font-semibold">Nuevo pedido</h1>
      <p className="text-apagado">Primero los datos del pedido. Después podrás añadir sus cartas.</p>
      <div className="tarjeta">
        <FormularioPedido accion={crearPedido} textoBoton="Crear pedido" />
      </div>
    </main>
  );
}
