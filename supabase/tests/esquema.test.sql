-- Pruebas del esquema: reparto del envío, cálculos y RLS.
-- Datos del pedido de 7,70 € de envío del Excel original (3 cartas).
\set ON_ERROR_STOP 1
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

insert into auth.users values ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');
insert into productos (id_producto, nombre, trend, trend_holo) values
  (1, 'Reshiram & Charizard GX', 31.02, null),
  (2, 'Regigigas VSTAR', 10.34, null),
  (3, 'Bramaluna ex', 31.48, 40);

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
insert into pedidos (fecha, envio_total) values ('2026-09-01', 7.70);
insert into ejemplares (id_producto, origen, id_pedido, precio_compra) values
  (1, 'pedido', 1, 24.5), (2, 'pedido', 1, 8.9), (3, 'pedido', 1, 30);
insert into ejemplares (id_producto, origen, fecha_obtencion, valor_referencia, fuente_valor, es_holo)
  values (3, 'sobre', '2026-10-01', 35, 'manual', true);

create function pg_temp.esperar(cond boolean, que text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'FALLO: %', que; end if;
  raise notice 'ok: %', que;
end $$;

-- Reparto a partes iguales: 7,70 / 3, como en el Excel
select pg_temp.esperar(round(envio_asignado, 4) = 2.5667, 'envío a partes iguales')
  from ejemplares_resumen where id = 1;
select pg_temp.esperar(round(coste_total, 3) = 27.067 and round(beneficio, 3) = 3.953, 'coste y beneficio de una compra')
  from ejemplares_resumen where id = 1;
-- Carta de sobre: sin coste, valor holo, revalorización sobre el valor de referencia
select pg_temp.esperar(coste_total is null and valor_actual = 40 and revalorizacion = 5, 'carta de sobre')
  from ejemplares_resumen where id = 4;
-- Reparto proporcional al precio
update pedidos set reparto = 'proporcional';
select pg_temp.esperar(round(envio_asignado, 3) = 2.976, 'envío proporcional')
  from ejemplares_resumen where id = 1;
select pg_temp.esperar(round(sum(envio_asignado), 2) = 7.70, 'el reparto suma el envío total')
  from ejemplares_resumen where origen = 'pedido';
select pg_temp.esperar(cartas = 3 and coste_total = 71.10 and round(beneficio, 2) = 1.74, 'resumen del pedido')
  from pedidos_resumen where id = 1;

-- Otro usuario no ve nada ni puede usar el pedido ajeno
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
select pg_temp.esperar(count(*) = 0, 'RLS: ejemplares ajenos ocultos') from ejemplares_resumen;
select pg_temp.esperar(count(*) = 0, 'RLS: pedidos ajenos ocultos') from pedidos_resumen;

do $$ begin
  insert into ejemplares (id_producto, origen, id_pedido, precio_compra) values (1, 'pedido', 1, 3);
  raise exception 'FALLO: se pudo usar un pedido ajeno';
exception when raise_exception then
  if sqlerrm like 'FALLO%' then raise; end if;
  raise notice 'ok: pedido ajeno rechazado';
end $$;

do $$ begin
  insert into ejemplares (id_producto, origen, precio_compra) values (1, 'pedido', 3);
  raise exception 'FALLO: ejemplar de pedido sin pedido';
exception when check_violation then
  raise notice 'ok: coherencia origen/pedido';
end $$;
