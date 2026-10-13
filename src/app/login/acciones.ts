"use server";

import { redirect } from "next/navigation";
import { configSupabase } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoLogin = { error?: string; email?: string };

export async function entrar(_: EstadoLogin, datos: FormData): Promise<EstadoLogin> {
  const email = String(datos.get("email") ?? "").trim();
  const contrasena = String(datos.get("contrasena") ?? "");
  if (!email || !contrasena) return { error: "Escribe tu email y tu contraseña.", email };

  if (!configSupabase()) {
    return {
      email,
      error:
        "Faltan o están mal escritas las variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en Vercel. Revísalas y vuelve a desplegar.",
    };
  }

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.signInWithPassword({ email, password: contrasena });
    if (error) {
      console.error("signInWithPassword:", error.code, error.status, error.message);
      return { email, error: mensajeDeError(error.code, error.message) };
    }
  } catch (e) {
    console.error("signInWithPassword:", e);
    return { email, error: `No se pudo contactar con Supabase: ${e instanceof Error ? e.message : String(e)}` };
  }

  redirect("/");
}

function mensajeDeError(codigo: string | undefined, mensaje: string) {
  switch (codigo) {
    case "invalid_credentials":
      return "Email o contraseña incorrectos.";
    case "email_not_confirmed":
      return "Tu usuario no está confirmado. En Supabase, Authentication → Users, confírmalo o créalo con «Auto Confirm User».";
    case "over_request_rate_limit":
      return "Demasiados intentos seguidos. Espera un momento y vuelve a probar.";
    case "email_provider_disabled":
      return "El acceso por email está desactivado en Supabase (Authentication → Sign In / Providers → Email).";
    default:
      return `Supabase ha devuelto un error: ${mensaje}${codigo ? ` (${codigo})` : ""}`;
  }
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
