import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { configSupabase } from "./config";

export async function crearClienteServidor() {
  const config = configSupabase();
  if (!config) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const almacen = await cookies();
  return createServerClient(
    config.url,
    config.clave,
    {
      cookies: {
        getAll: () => almacen.getAll(),
        setAll: (lista) => {
          try {
            for (const { name, value, options } of lista) almacen.set(name, value, options);
          } catch {
            // Desde un Server Component no se pueden escribir cookies; el proxy ya refresca la sesión.
          }
        },
      },
    },
  );
}

/** Cliente de Supabase con sesión obligatoria: sin usuario, redirige a /login. */
export async function clienteConSesion() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return { supabase, usuario: data.user };
}
