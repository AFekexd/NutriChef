#!/bin/bash

# Quick fix script for Node.js installation conflict
# Run this on the server: sudo bash fix-nodejs.sh

set -e

echo "🔧 Fixing Node.js installation conflict..."

# Stop dpkg process and fix broken packages
echo "1. Fixing broken dpkg state..."
dpkg --configure -a
apt-get install -f -y

# Force remove problematic packages
echo "2. Force removing conflicting packages..."
dpkg --remove --force-remove-reinstreq nodejs npm libnode-dev libnode72 nodejs-doc 2>/dev/null || true

# Remove via apt
echo "3. Purging Node.js packages..."
apt-get remove --purge -y nodejs npm libnode-dev libnode72 nodejs-doc 2>/dev/null || true
apt-get autoremove -y
apt-get autoclean

# Remove all Node.js files manually
echo "4. Removing Node.js files..."
rm -rf /usr/include/node
rm -rf /usr/local/bin/node /usr/local/bin/npm /usr/local/bin/npx
rm -rf /usr/local/lib/node*
rm -rf /usr/local/include/node*
rm -rf /usr/share/doc/nodejs
rm -rf /var/lib/dpkg/info/nodejs*
rm -rf /var/lib/dpkg/info/libnode*
rm -rf /var/cache/apt/archives/nodejs*

# Clear apt cache
echo "5. Cleaning apt cache..."
apt-get clean

# Fix any remaining issues
echo "6. Final fixes..."
apt-get install -f -y
apt-get update

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📋 Checking PostgreSQL status..."
if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL is running"
else
    echo "⚠️  PostgreSQL is not running. Starting it..."
    systemctl start postgresql
    systemctl enable postgresql
    if systemctl is-active --quiet postgresql; then
        echo "✅ PostgreSQL started successfully"
    else
        echo "❌ PostgreSQL failed to start. Run: sudo systemctl status postgresql"
    fi
fi
echo ""
echo "Now you can install Node.js cleanly using nvm:"
echo ""
echo "  # Install nvm"
echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
echo ""
echo "  # Load nvm"
echo "  export NVM_DIR=\"\$HOME/.nvm\""
echo "  [ -s \"\$NVM_DIR/nvm.sh\" ] && \\. \"\$NVM_DIR/nvm.sh\""
echo ""
echo "  # Install Node.js 20"
echo "  nvm install 20"
echo "  nvm use 20"
echo "  nvm alias default 20"
echo ""
echo "  # Verify"
echo "  node --version"
echo "  npm --version"
echo ""
