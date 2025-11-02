#!/bin/bash
set -e

echo "🔨 Building NutriChef Backend..."
echo ""

# Navigate to backend directory
cd /var/www/nutrichef/backend || {
    echo "❌ Error: Backend directory not found"
    exit 1
}

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    exit 1
fi

# Load nvm if available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Check Node.js version
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci  # Install all dependencies including devDependencies for TypeScript
    echo "✅ Dependencies installed"
    echo ""
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Build TypeScript
echo "🏗️  Compiling TypeScript..."
npm run build

if [ ! -f "dist/index.js" ]; then
    echo "❌ Error: Build failed - dist/index.js not found"
    exit 1
fi

echo "✅ Backend built successfully!"
echo ""

# Restart the service
echo "🔄 Restarting backend service..."
systemctl restart nutrichef-backend
echo "✅ Service restarted"
echo ""

# Check service status
sleep 2
if systemctl is-active --quiet nutrichef-backend; then
    echo "✅ Backend service is running!"
    systemctl status nutrichef-backend --no-pager -l
else
    echo "❌ Backend service failed to start"
    echo ""
    echo "📋 Recent logs:"
    journalctl -u nutrichef-backend -n 30 --no-pager
    exit 1
fi
