#!/bin/bash

set -e

echo "🚀 NutriChef Deployment Setup Script"
echo "======================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (sudo ./setup.sh)"
    exit 1
fi

# Variables
DOMAIN="${1:-nutrichef.example.com}"
APP_DIR="/var/www/nutrichef"
POSTGRES_PASSWORD=$(openssl rand -base64 32)

echo "📦 Domain: $DOMAIN"
echo "📂 Installation directory: $APP_DIR"

# Update system
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# Install dependencies
echo "📦 Installing dependencies..."
apt-get install -y \
    git \
    curl \
    nginx \
    postgresql \
    postgresql-contrib \
    certbot \
    python3-certbot-nginx \
    build-essential \
    ufw

# Remove old Node.js if exists
echo "🧹 Removing old Node.js..."
apt-get remove --purge -y nodejs npm libnode-dev libnode72 nodejs-doc 2>/dev/null || true
apt-get autoremove -y
rm -rf /usr/include/node /usr/local/bin/npm /usr/local/bin/node

# Install nvm (Node Version Manager)
echo "📦 Installing nvm and Node.js 20..."
if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify installation
echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Configure PostgreSQL
echo "🗄️  Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE nutrichef;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER nutrichef WITH ENCRYPTED PASSWORD '$POSTGRES_PASSWORD';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nutrichef TO nutrichef;"
sudo -u postgres psql -c "ALTER DATABASE nutrichef OWNER TO nutrichef;"

# Clone repository
echo "📥 Cloning repository..."
if [ ! -d "$APP_DIR" ]; then
    git clone https://github.com/AFekexd/NutriChef.git $APP_DIR
else
    echo "Directory already exists, pulling latest changes..."
    cd $APP_DIR && git pull origin main
fi

cd $APP_DIR

# Setup backend environment
echo "⚙️  Setting up backend environment..."
if [ ! -f "backend/.env" ]; then
    cat > backend/.env << EOF
# Database
DATABASE_URL="postgresql://nutrichef:$POSTGRES_PASSWORD@localhost:5432/nutrichef"

# JWT
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=production

# AI Services (FILL THESE IN!)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# CORS
CORS_ORIGIN=https://$DOMAIN

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    echo "⚠️  Please edit backend/.env and add your API keys!"
fi

# Setup frontend environment
echo "⚙️  Setting up frontend environment..."
if [ ! -f "frontend/.env" ]; then
    cat > frontend/.env << EOF
VITE_API_URL=https://$DOMAIN/api
EOF
fi

# Install backend dependencies and run migrations
echo "📦 Installing backend dependencies..."
cd backend
npm ci --production
npx prisma generate
npx prisma migrate deploy

# Build frontend
echo "🏗️  Building frontend..."
cd ../frontend
npm ci
npm run build

# Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/nutrichef << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    root $APP_DIR/frontend/dist;
    index index.html;

    # Frontend - SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
EOF

ln -sf /etc/nginx/sites-available/nutrichef /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl restart nginx

# Setup systemd service for backend
echo "⚙️  Creating systemd service..."
cat > /etc/systemd/system/nutrichef-backend.service << EOF
[Unit]
Description=NutriChef Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR/backend
Environment=NODE_ENV=production
Environment=PATH=$NVM_DIR/versions/node/v20.19.5/bin:\$PATH
ExecStart=$NVM_DIR/versions/node/v20.19.5/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable nutrichef-backend
systemctl start nutrichef-backend

# Configure firewall
echo "🔒 Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload

# SSL Certificate
echo "🔐 Setting up SSL certificate..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || echo "SSL setup failed, you can run it manually later"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit backend/.env and add your API keys:"
echo "   nano $APP_DIR/backend/.env"
echo ""
echo "2. Restart backend service:"
echo "   systemctl restart nutrichef-backend"
echo ""
echo "3. Check service status:"
echo "   systemctl status nutrichef-backend"
echo ""
echo "4. View logs:"
echo "   journalctl -u nutrichef-backend -f"
echo ""
echo "5. Your site should be available at: https://$DOMAIN"
echo ""
echo "🔑 Database credentials (save these!):"
echo "   Username: nutrichef"
echo "   Password: $POSTGRES_PASSWORD"
echo "   Database: nutrichef"