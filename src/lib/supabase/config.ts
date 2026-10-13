// Configuración de Supabase a partir de las variables de entorno.
// La URL se reduce al dominio: si se copia con /rest/v1/ u otra ruta detrás, Supabase responde
// "Invalid path specified in request URL".
export function configSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const clave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !clave) return null;
  try {
    return { url: new URL(url).origin, clave };
  } catch {
    return null; // URL mal escrita (p. ej. sin https://)
  }
}
