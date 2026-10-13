#!/usr/bin/env bash
# Aplica las migraciones en una base de datos temporal y ejecuta las pruebas.
# Usa las variables PG* habituales para conectar con Postgres.
set -euo pipefail
cd "$(dirname "$0")/.."
BD=cartitas_pruebas
psql -q -d postgres -c "drop database if exists $BD" -c "create database $BD"
psql -q -v ON_ERROR_STOP=1 -d $BD -f tests/supabase-minimo.sql
for m in migrations/*.sql; do psql -q -v ON_ERROR_STOP=1 -d $BD -f "$m"; done
psql -q -t -v ON_ERROR_STOP=1 -d $BD -f tests/esquema.test.sql | sed "/^\s*$/d"
echo "Esquema OK"
