import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { configSupabase } from "@/lib/supabase/config";

// Refresca la sesión de Supabase en cada petición y manda a /login a quien no la tenga.
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });
  const config = configSupabase();
  // Sin configuración no hay sesión posible; /login explica qué falta.
  if (!config) {
    return request.nextUrl.pathname.startsWith("/login")
      ? respuesta
      : NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = createServerClient(
    config.url,
    config.clave,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista) => {
          for (const { name, value } of lista) request.cookies.set(name, value);
          respuesta = NextResponse.next({ request });
          for (const { name, value, options } of lista) respuesta.cookies.set(name, value, options);
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const publica = ["/login", "/auth"].some((r) => request.nextUrl.pathname.startsWith(r));
  if (!data.user && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return respuesta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg).*)"],
};
