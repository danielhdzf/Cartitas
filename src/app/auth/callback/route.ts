import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

// Destino del enlace mágico: canjea el código por una sesión.
export async function GET(request: NextRequest) {
  const codigo = request.nextUrl.searchParams.get("code");
  if (codigo) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.redirect(new URL("/login?error=enlace", request.url));
}
