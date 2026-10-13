"use client";

import { useActionState } from "react";
import { enviarEnlace, type EstadoLogin } from "./acciones";

export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState<EstadoLogin, FormData>(enviarEnlace, {});

  if (estado.enviado) {
    return <p className="text-center">Te he enviado un enlace por email. Ábrelo en este dispositivo para entrar.</p>;
  }

  return (
    <form action={accion} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm text-apagado">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="campo"
        placeholder="tu@email.com"
      />
      <button type="submit" disabled={enviando} className="boton">
        {enviando ? "Enviando…" : "Enviarme un enlace para entrar"}
      </button>
      {estado.error && <p className="text-sm text-perdida">{estado.error}</p>}
    </form>
  );
}
