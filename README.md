# Cartitas

Aplicación para seguir una colección de cartas Pokémon con precios de CardMarket: pedidos con envío repartido entre sus cartas, cartas sacadas de sobres, valor actual y evolución desde la compra.

**Stack:** Next.js (PWA) en Vercel · Supabase (Postgres, login, Storage) · proceso nocturno en GitHub Actions.

## De dónde salen los precios

CardMarket no da acceso nuevo a su API, pero publica cada noche (hacia las 02:50, hora de París) dos ficheros públicos:

- `price_guide_6.json`: por producto, `avg`, `low`, `trend`, medias de 1, 7 y 30 días y sus versiones holo.
- `products_singles_6.json`: catálogo de cartas sueltas (id, nombre, expansión).

`scripts/sync-precios.mjs` los descarga cada noche y:

1. Actualiza `productos` con el catálogo y el último precio.
2. Guarda una copia comprimida del Price Guide completo en Storage (`snapshots/AAAA-MM-DD.json.gz`). Así se puede saber lo que valía cualquier carta en cualquier día desde que la app está en marcha, por ejemplo una carta sacada de un sobre que se registra días después.
3. Apunta en `precios_diarios` el precio del día de las cartas que hay en la colección, para las gráficas.

El precio es por producto: CardMarket mezcla todos los idiomas y estados.

## Modelo de datos

- `productos`: catálogo de CardMarket con el último precio.
- `pedidos`: fecha, vendedor, envío total y otros gastos, y forma de repartirlos (`iguales` o `proporcional`).
- `ejemplares`: cada carta física. `origen = 'pedido'` (con pedido y precio de compra) u `origen = 'sobre'` (con fecha de obtención y valor de referencia).
- Vistas `ejemplares_resumen` y `pedidos_resumen`: envío asignado, coste total, valor actual, beneficio y revalorización.

Todo está en `supabase/migrations/`. Cada usuario solo ve sus pedidos y ejemplares (RLS).

## Puesta en marcha

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (plan gratuito).
2. En **SQL Editor**, ejecuta `supabase/migrations/20261013000000_esquema_inicial.sql`. Otra opción es usar la CLI con `supabase link` y `supabase db push`.
3. En **Authentication → Users → Add user → Create new user**, crea tu usuario con email y contraseña y marca *Auto Confirm User*. La app entra con email y contraseña y no deja registrarse a nadie más.
4. En **Authentication → Sign In / Providers**, desactiva *Allow new users to sign up*.

### 2. Proceso nocturno (GitHub Actions)

En el repositorio, **Settings → Secrets and variables → Actions**, crea:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API keys → secret key)

Después lanza el workflow **Precios de CardMarket** a mano desde la pestaña Actions para cargar el catálogo la primera vez. A partir de ahí se ejecuta solo cada noche.

### 3. App (Vercel)

1. Importa el repositorio en [vercel.com](https://vercel.com).
2. Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (la publishable key de Supabase).
3. En el móvil, abre la web y usa "Añadir a pantalla de inicio".

### En local

```bash
cp .env.example .env.local   # y rellena los valores
npm install
npm run dev
```

## Pruebas

```bash
npm test          # transformación de los ficheros de CardMarket
npm run test:db   # esquema, reparto del envío y RLS (necesita Postgres; usa las variables PG*)
```
