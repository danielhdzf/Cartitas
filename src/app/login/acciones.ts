"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { configSupabase } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoLogin = { error?: string; enviado?: boolean };

export async function enviarEnlace(_: EstadoLogin, datos: FormData): Promise<EstadoLogin> {
  const email = String(datos.get("email") ?? "").trim();
  if (!email) return { error: "Escribe tu email." };

  if (!configSupabase()) {
    return {
      error:
        "Faltan o están mal escritas las variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en Vercel. Revísalas y vuelve a desplegar.",
    };
  }

  const origen = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origen}/auth/callback`, shouldCreateUser: false },
    });
    if (error) {
      console.error("signInWithOtp:", error.code, error.status, error.message);
      return { error: mensajeDeError(error.code, error.message) };
    }
  } catch (e) {
    console.error("signInWithOtp:", e);
    return { error: `No se pudo contactar con Supabase: ${e instanceof Error ? e.message : String(e)}` };
  }
  return { enviado: true };
}

function mensajeDeError(codigo: string | undefined, mensaje: string) {
  switch (codigo) {
    case "otp_disabled":
    case "signup_disabled":
    case "user_not_found":
      return "Ese email no tiene usuario en Supabase. Créalo en Authentication → Users.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Supabase ha limitado los envíos de email. Espera un rato y vuelve a probar.";
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
