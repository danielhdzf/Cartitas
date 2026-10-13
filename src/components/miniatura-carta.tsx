/* eslint-disable @next/next/no-img-element -- las imágenes vienen de TCGdex u otras URLs elegidas por el usuario */

const TAMANOS = { s: "h-14 w-10", m: "h-28 w-20", l: "w-48 sm:w-full max-w-xs aspect-[5/7]" } as const;

export function MiniaturaCarta({
  url,
  nombre,
  tam = "m",
}: {
  url: string | null;
  nombre: string;
  tam?: keyof typeof TAMANOS;
}) {
  const clases = `${TAMANOS[tam]} shrink-0 rounded-md border border-borde bg-fondo object-cover`;
  if (!url) {
    return (
      <div className={`${clases} flex items-center justify-center text-[10px] text-apagado`} aria-hidden>
        Sin imagen
      </div>
    );
  }
  return <img src={url} alt={nombre} loading="lazy" className={clases} />;
}
