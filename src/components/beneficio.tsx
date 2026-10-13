import { formatoEuros } from "@/lib/formato";

/** Importe con signo y color: verde si gana, rojo si pierde. */
export function Beneficio({ valor, pct }: { valor: number | null | undefined; pct?: number | null }) {
  if (valor === null || valor === undefined) return <span className="text-apagado">—</span>;
  const n = Number(valor);
  const clase = n > 0 ? "text-ganancia" : n < 0 ? "text-perdida" : "text-apagado";
  const signo = n > 0 ? "+" : "";
  return (
    <span className={clase}>
      {signo}{formatoEuros(n)}
      {pct !== null && pct !== undefined && <> ({signo}{(Number(pct) * 100).toFixed(1)} %)</>}
    </span>
  );
}
