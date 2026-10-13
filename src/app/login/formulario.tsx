"use client";

import { useActionState } from "react";
import { entrar, type EstadoLogin } from "./acciones";

export function FormularioLogin() {
  const [estado, accion, entrando] = useActionState<EstadoLogin, FormData>(entrar, {});

  return (
    <form action={accion} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm text-apagado">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        defaultValue={estado.email}
        className="campo"
        placeholder="tu@email.com"
      />
      <label htmlFor="contrasena" className="text-sm text-apagado">Contraseña</label>
      <input
        id="contrasena"
        name="contrasena"
        type="password"
        required
        autoComplete="current-password"
        className="campo"
      />
      <button type="submit" disabled={entrando} className="boton mt-2">
        {entrando ? "Entrando…" : "Entrar"}
      </button>
      {estado.error && <p role="alert" className="text-sm text-perdida">{estado.error}</p>}
    </form>
  );
}
