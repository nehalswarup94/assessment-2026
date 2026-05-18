#!/bin/bash
set -e

DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

export PGPASSWORD=$DB_PASSWORD

create_db() {
  local db_name=$1
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -tc "SELECT 1 FROM pg_database WHERE datname = '$db_name'" | grep -q 1 || \
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $db_name"
  echo "Database '$db_name' is ready"
}

# Create databases
create_db induction
create_db company

# Run migrations
run_migrations() {
  local db_name=$1
  pwd
  local migrations_dir="migrations/$db_name"
  
  if [ -d "$migrations_dir" ]; then
    echo "Running migrations for '$db_name'..."
    for migration in "$migrations_dir"/*.sql; do
      if [ -f "$migration" ]; then
        echo "  Applying: $(basename "$migration")"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_name" -f "$migration"
      fi
    done
    echo "Migrations for '$db_name' complete"
  else
    echo "No migrations directory found for '$db_name'"
  fi
}

run_migrations induction
run_migrations company

# Run seeds
run_seeds() {
  local db_name=$1
  local seeds_dir="seeds/$db_name"
  
  if [ -d "$seeds_dir" ]; then
    echo "Running seeds for '$db_name'..."
    for seed in "$seeds_dir"/*.sql; do
      if [ -f "$seed" ]; then
        echo "  Applying: $(basename "$seed")"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_name" -f "$seed"
      fi
    done
    echo "Seeds for '$db_name' complete"
  else
    echo "No seeds directory found for '$db_name'"
  fi
}

run_seeds company
run_seeds induction

echo "Database init complete"
