#!/bin/bash
set -e

PGDATA_DIR="/home/runner/workspace/.postgresql/data"
PGSOCKET_DIR="/home/runner/workspace/.postgresql/run"
PGLOG="/home/runner/workspace/.postgresql/logfile"

# Unset empty PG env vars that can confuse postgres tools
unset PGPORT PGHOST PGUSER PGPASSWORD PGDATABASE

# Initialize PostgreSQL if not already done
if [ ! -f "$PGDATA_DIR/PG_VERSION" ]; then
  echo "Initializing PostgreSQL..."
  mkdir -p "$PGDATA_DIR"
  initdb -D "$PGDATA_DIR" --no-locale --encoding=UTF8
  
  # Configure to use custom socket directory and disable TCP
  mkdir -p "$PGSOCKET_DIR"
  cat >> "$PGDATA_DIR/postgresql.conf" << EOF
unix_socket_directories = '$PGSOCKET_DIR'
listen_addresses = ''
EOF
fi

mkdir -p "$PGSOCKET_DIR"

# Start PostgreSQL if not running
if ! pg_ctl -D "$PGDATA_DIR" status > /dev/null 2>&1; then
  echo "Starting PostgreSQL..."
  pg_ctl -D "$PGDATA_DIR" -l "$PGLOG" start -w
  sleep 1
fi

# Create database if it doesn't exist
PGHOST="$PGSOCKET_DIR" psql postgres -tc "SELECT 1 FROM pg_database WHERE datname='pilotzap'" | grep -q 1 || \
  PGHOST="$PGSOCKET_DIR" createdb pilotzap && echo "Database pilotzap ready"

# Export DATABASE_URL for the Node process
export DATABASE_URL="postgresql://runner@localhost/pilotzap?host=$PGSOCKET_DIR"

echo "Starting application with DATABASE_URL set..."
exec npm run dev
