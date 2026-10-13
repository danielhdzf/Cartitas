import { ESTADOS, IDIOMAS } from "@/lib/coleccion/tipos";

/** Idioma, estado, holo y notas, comunes a cartas de pedido y de sobre. */
export function CamposEjemplar({
  valores,
}: {
  valores?: { idioma?: string; estado?: string; es_holo?: boolean; notas?: string | null };
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-apagado">
          Idioma
          <select name="idioma" defaultValue={valores?.idioma ?? "JP"} className="campo text-texto">
            {IDIOMAS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-apagado">
          Estado
          <select name="estado" defaultValue={valores?.estado ?? "NM"} className="campo text-texto">
            {ESTADOS.map(([c, n]) => <option key={c} value={c}>{c} · {n}</option>)}
          </select>
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="es_holo" defaultChecked={valores?.es_holo} className="size-4" />
        Holo / reverse holo (usa el precio holo de CardMarket)
      </label>
      <label className="flex flex-col gap-1 text-sm text-apagado">
        Notas
        <input name="notas" defaultValue={valores?.notas ?? ""} className="campo text-texto" />
      </label>
    </>
  );
}
