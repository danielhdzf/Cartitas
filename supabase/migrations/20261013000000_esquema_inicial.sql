-- Cartitas: esquema inicial
-- Productos y precios vienen del Price Guide público de CardMarket (Pokémon = juego 6).
-- Pedidos y ejemplares son de cada usuario y van protegidos con RLS.

-- ─── Catálogo de CardMarket ────────────────────────────────────────────────

create table public.productos (
  id_producto   integer primary key,          -- idProduct de CardMarket
  nombre        text not null,
  id_expansion  integer,
  id_categoria  integer,
  id_metacarta  integer,
  imagen_url    text,                         -- se rellena desde TCGdex
  tcgdex_id     text,
  -- Último precio conocido (Price Guide de la noche más reciente)
  avg           numeric(12, 2),
  low           numeric(12, 2),
  trend         numeric(12, 2),
  avg1          numeric(12, 2),
  avg7          numeric(12, 2),
  avg30         numeric(12, 2),
  avg_holo      numeric(12, 2),
  low_holo      numeric(12, 2),
  trend_holo    numeric(12, 2),
  avg7_holo     numeric(12, 2),
  avg30_holo    numeric(12, 2),
  precio_fecha  date,
  actualizado   timestamptz not null default now()
);

create index productos_nombre_idx on public.productos using gin (to_tsvector('simple', nombre));
create index productos_nombre_lower_idx on public.productos (lower(nombre) text_pattern_ops);
create index productos_expansion_idx on public.productos (id_expansion);

-- Histórico diario solo de los productos que alguien tiene en su colección
create table public.precios_diarios (
  id_producto  integer not null references public.productos (id_producto),
  fecha        date not null,
  avg          numeric(12, 2),
  low          numeric(12, 2),
  trend        numeric(12, 2),
  avg7         numeric(12, 2),
  avg30        numeric(12, 2),
  avg_holo     numeric(12, 2),
  trend_holo   numeric(12, 2),
  avg7_holo    numeric(12, 2),
  avg30_holo   numeric(12, 2),
  primary key (id_producto, fecha)
);

-- Registro de cada ejecución del proceso nocturno
create table public.sincronizaciones (
  fecha_precios     date primary key,          -- fecha del Price Guide (createdAt)
  creado_cardmarket timestamptz not null,
  productos         integer not null,
  precios           integer not null,
  snapshot_ruta     text,
  ejecutado         timestamptz not null default now()
);

-- ─── Colección del usuario ─────────────────────────────────────────────────

create table public.pedidos (
  id            bigint generated always as identity primary key,
  usuario_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha         date not null,
  vendedor      text,
  plataforma    text not null default 'CardMarket',
  envio_total   numeric(10, 2) not null default 0 check (envio_total >= 0),
  otros_gastos  numeric(10, 2) not null default 0 check (otros_gastos >= 0),
  reparto       text not null default 'iguales' check (reparto in ('iguales', 'proporcional')),
  notas         text,
  creado        timestamptz not null default now()
);

create index pedidos_usuario_idx on public.pedidos (usuario_id);

create table public.ejemplares (
  id                bigint generated always as identity primary key,
  usuario_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id_producto       integer not null references public.productos (id_producto),
  origen            text not null check (origen in ('pedido', 'sobre')),
  id_pedido         bigint references public.pedidos (id) on delete cascade,
  precio_compra     numeric(10, 2) check (precio_compra >= 0),
  fecha_obtencion   date,                     -- solo sobres; en pedidos se usa la del pedido
  idioma            text not null default 'JP',
  estado            text not null default 'NM'
                    check (estado in ('MT', 'NM', 'EX', 'GD', 'LP', 'PL', 'PO')),
  es_holo           boolean not null default false,
  valor_referencia  numeric(10, 2),           -- valor en la fecha de obtención
  fuente_valor      text check (fuente_valor in ('exacto', 'aproximado', 'manual')),
  notas             text,
  creado            timestamptz not null default now(),
  constraint ejemplar_pedido_coherente check (
    (origen = 'pedido' and id_pedido is not null and precio_compra is not null and fecha_obtencion is null)
    or
    (origen = 'sobre' and id_pedido is null and precio_compra is null and fecha_obtencion is not null)
  )
);

create index ejemplares_usuario_idx on public.ejemplares (usuario_id);
create index ejemplares_pedido_idx on public.ejemplares (id_pedido);
create index ejemplares_producto_idx on public.ejemplares (id_producto);

-- Un ejemplar solo puede ir en un pedido del mismo usuario
create function public.comprobar_pedido_del_usuario() returns trigger
language plpgsql as $$
begin
  if new.id_pedido is not null and not exists (
    select 1 from public.pedidos p where p.id = new.id_pedido and p.usuario_id = new.usuario_id
  ) then
    raise exception 'El pedido % no pertenece a este usuario', new.id_pedido;
  end if;
  return new;
end;
$$;

create trigger ejemplares_pedido_del_usuario
before insert or update on public.ejemplares
for each row execute function public.comprobar_pedido_del_usuario();

-- ─── Cálculos ──────────────────────────────────────────────────────────────

-- Cada ejemplar con su envío asignado, coste, valor actual, beneficio y revalorización.
-- "Valor" = trend de CardMarket (trend_holo si el ejemplar es holo).
create view public.ejemplares_calculados with (security_invoker = true) as
with por_pedido as (
  select
    e.id,
    count(*) over (partition by e.id_pedido)              as cartas_en_pedido,
    sum(e.precio_compra) over (partition by e.id_pedido)  as suma_precios_pedido
  from public.ejemplares e
  where e.origen = 'pedido'
)
select
  e.*,
  pr.nombre,
  pr.id_expansion,
  pr.imagen_url,
  coalesce(e.fecha_obtencion, p.fecha) as fecha,
  p.fecha as fecha_pedido,
  p.vendedor,
  case
    when e.origen <> 'pedido' then null
    when p.reparto = 'proporcional' and pp.suma_precios_pedido > 0
      then (p.envio_total + p.otros_gastos) * e.precio_compra / pp.suma_precios_pedido
    else (p.envio_total + p.otros_gastos) / pp.cartas_en_pedido
  end as envio_asignado,
  case when e.es_holo then coalesce(pr.trend_holo, pr.trend) else pr.trend end as valor_actual,
  pr.precio_fecha
from public.ejemplares e
join public.productos pr on pr.id_producto = e.id_producto
left join public.pedidos p on p.id = e.id_pedido
left join por_pedido pp on pp.id = e.id;

-- Capa encima para no repetir las fórmulas
create view public.ejemplares_resumen with (security_invoker = true) as
select
  c.*,
  c.precio_compra + c.envio_asignado                       as coste_total,
  c.valor_actual - (c.precio_compra + c.envio_asignado)    as beneficio,
  case when c.precio_compra + c.envio_asignado > 0
    then (c.valor_actual - (c.precio_compra + c.envio_asignado)) / (c.precio_compra + c.envio_asignado)
  end                                                      as beneficio_pct,
  c.valor_actual - c.valor_referencia                      as revalorizacion
from public.ejemplares_calculados c;

create view public.pedidos_resumen with (security_invoker = true) as
select
  p.*,
  count(e.id)                                             as cartas,
  coalesce(sum(e.precio_compra), 0)                       as total_cartas,
  coalesce(sum(e.precio_compra), 0) + p.envio_total + p.otros_gastos as coste_total,
  sum(e.valor_actual)                                     as valor_actual,
  sum(e.valor_actual) - (coalesce(sum(e.precio_compra), 0) + p.envio_total + p.otros_gastos) as beneficio
from public.pedidos p
left join public.ejemplares_calculados e on e.id_pedido = p.id
group by p.id;

-- Productos distintos que hay en alguna colección (lo usa el proceso nocturno)
create view public.productos_en_coleccion as
select distinct id_producto from public.ejemplares;

revoke all on public.productos_en_coleccion from anon, authenticated;

-- ─── Seguridad (RLS) ───────────────────────────────────────────────────────
-- El proceso nocturno usa la service role key, que se salta RLS.

alter table public.productos enable row level security;
alter table public.precios_diarios enable row level security;
alter table public.sincronizaciones enable row level security;
alter table public.pedidos enable row level security;
alter table public.ejemplares enable row level security;

create policy "Catálogo visible para usuarios con sesión"
  on public.productos for select to authenticated using (true);
create policy "Precios visibles para usuarios con sesión"
  on public.precios_diarios for select to authenticated using (true);
create policy "Sincronizaciones visibles para usuarios con sesión"
  on public.sincronizaciones for select to authenticated using (true);

create policy "Cada usuario gestiona sus pedidos"
  on public.pedidos for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy "Cada usuario gestiona sus ejemplares"
  on public.ejemplares for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- ─── Storage: copia diaria completa del Price Guide ────────────────────────

insert into storage.buckets (id, name, public)
values ('snapshots', 'snapshots', false)
on conflict (id) do nothing;

create policy "Snapshots legibles para usuarios con sesión"
  on storage.objects for select to authenticated
  using (bucket_id = 'snapshots');
