-- Fase 2: elegir la imagen de un producto desde la app.
-- `productos` es de solo lectura para los usuarios; esta función solo deja tocar la imagen.

create function public.elegir_imagen(p_id_producto integer, p_imagen_url text, p_tcgdex_id text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Hace falta iniciar sesión';
  end if;
  if p_imagen_url is not null and p_imagen_url !~ '^https://' then
    raise exception 'La imagen tiene que ser una URL https://';
  end if;
  update productos
     set imagen_url = p_imagen_url,
         tcgdex_id = p_tcgdex_id
   where id_producto = p_id_producto;
  if not found then
    raise exception 'No existe el producto %', p_id_producto;
  end if;
end;
$$;

revoke all on function public.elegir_imagen(integer, text, text) from public, anon;
grant execute on function public.elegir_imagen(integer, text, text) to authenticated;
