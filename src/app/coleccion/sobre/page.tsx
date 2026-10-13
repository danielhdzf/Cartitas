import type { Metadata } from "next";
import Link from "next/link";
import { FormularioSobre } from "./formulario";

export const metadata: Metadata = { title: "Carta de sobre" };

export default function NuevaCartaDeSobre() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
      <Link href="/coleccion" className="text-sm text-apagado">← Colección</Link>
      <h1 className="text-2xl font-semibold">Carta sacada de un sobre</h1>
      <p className="text-apagado">
        No tiene pedido ni precio de compra. Su referencia será lo que valía el día que la sacaste
        (este cálculo llega en la siguiente fase).
      </p>
      <div className="tarjeta">
        <FormularioSobre />
      </div>
    </main>
  );
}
