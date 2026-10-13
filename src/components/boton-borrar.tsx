"use client";

import { useTransition } from "react";

export function BotonBorrar({ accion, pregunta, texto }: { accion: () => Promise<void>; pregunta: string; texto: string }) {
  const [borrando, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={borrando}
      className="text-sm text-perdida underline disabled:opacity-60"
      onClick={() => {
        if (confirm(pregunta)) startTransition(accion);
      }}
    >
      {borrando ? "Borrando…" : texto}
    </button>
  );
}
