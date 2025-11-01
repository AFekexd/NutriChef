#!/bin/bash

# Quick fix script for PostgreSQL connection issues
# Run this on the server: sudo bash fix-postgresql.sh

set -e

echo "🔧 Fixing PostgreSQL connection issues..."
echo ""

# Get PostgreSQL version
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version | grep -oP '\d+' | head -1)
    echo "✅ PostgreSQL version: $PG_VERSION"
else
    echo "❌ PostgreSQL not installed!"
    echo "Installing PostgreSQL..."
    apt-get update
    apt-get install -y postgresql postgresql-contrib
    PG_VERSION=$(psql --version | grep -oP '\d+' | head -1)
fi

echo ""
echo "📋 Current PostgreSQL clusters:"
pg_lsclusters || echo "No clusters found"
echo ""

# Stop any running PostgreSQL processes
echo "🛑 Stopping PostgreSQL services..."
systemctl stop postgresql 2>/dev/null || true
systemctl stop postgresql@$PG_VERSION-main 2>/dev/null || true

# Kill any lingering postgres processes
echo "🔪 Killing any lingering PostgreSQL processes..."
pkill -9 postgres 2>/dev/null || true
sleep 2

# Check and free port 5432 if occupied
echo "🔍 Checking port 5432..."
if lsof -i :5432 >/dev/null 2>&1; then
    echo "⚠️  Port 5432 is occupied. Attempting to free it..."
    PORT_PID=$(lsof -t -i :5432 2>/dev/null || true)
    if [ -n "$PORT_PID" ]; then
        echo "Killing process $PORT_PID on port 5432..."
        kill -9 $PORT_PID 2>/dev/null || true
        sleep 1
    fi
else
    echo "✅ Port 5432 is free"
fi

# Check if main cluster exists and is corrupted
if pg_lsclusters | grep -q "main"; then
    CLUSTER_STATUS=$(pg_lsclusters | grep main | awk '{print $4}')
    echo "Cluster status: $CLUSTER_STATUS"
    
    if [ "$CLUSTER_STATUS" == "down" ]; then
        echo "⚠️  Cluster is down. Attempting to fix..."
        
        # Fix permissions
        echo "🔧 Fixing permissions..."
        chown -R postgres:postgres /var/lib/postgresql/$PG_VERSION 2>/dev/null || true
        chown -R postgres:postgres /etc/postgresql/$PG_VERSION 2>/dev/null || true
        chown -R postgres:postgres /var/run/postgresql 2>/dev/null || true
        chmod 700 /var/lib/postgresql/$PG_VERSION/main 2>/dev/null || true
        
        # Try to start
        echo "🔄 Attempting to start cluster..."
        if ! pg_ctlcluster $PG_VERSION main start 2>&1; then
            echo "❌ Failed to start cluster. Recreating it..."
            
            # Drop and recreate cluster
            pg_dropcluster --stop $PG_VERSION main 2>/dev/null || true
            pg_createcluster $PG_VERSION main
        fi
    fi
else
    echo "⚠️  No 'main' cluster found. Creating it..."
    pg_createcluster $PG_VERSION main
fi

echo ""
echo "🔧 Fixing socket directory..."
mkdir -p /var/run/postgresql
chown postgres:postgres /var/run/postgresql
chmod 755 /var/run/postgresql
echo "✅ Socket directory configured"

echo ""
echo "🔄 Starting PostgreSQL cluster..."
pg_ctlcluster $PG_VERSION main start

echo ""
echo "🔄 Starting PostgreSQL service..."
systemctl start postgresql
systemctl enable postgresql
sleep 3

echo ""
echo "📊 PostgreSQL service status:"
systemctl status postgresql --no-pager -l || true

echo ""
echo "📋 Current clusters:"
pg_lsclusters

echo ""
echo "📋 Testing connection..."
if sudo -u postgres psql -c "SELECT version();" 2>&1; then
    echo ""
    echo "✅ PostgreSQL connection successful!"
else
    echo ""
    echo "❌ Connection still failing. Full diagnostic:"
    echo ""
    echo "=== Cluster Status ==="
    pg_lsclusters
    echo ""
    echo "=== Service Status ==="
    systemctl status postgresql@$PG_VERSION-main --no-pager -l || true
    echo ""
    echo "=== Recent Logs ==="
    journalctl -u postgresql@$PG_VERSION-main -n 50 --no-pager || true
    echo ""
    echo "=== Data Directory ==="
    ls -la /var/lib/postgresql/$PG_VERSION/main/ || echo "Directory not found"
    echo ""
    echo "❌ Please review the output above for errors."
    echo ""
    echo "If nothing works, try a full reinstall:"
    echo "  sudo apt-get remove --purge postgresql postgresql-*"
    echo "  sudo rm -rf /var/lib/postgresql /etc/postgresql"
    echo "  sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

echo ""
echo "✅ PostgreSQL is now working correctly!"
echo ""
echo "You can now run your setup script."
