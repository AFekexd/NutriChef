#!/bin/bash

# NutriChef Ubuntu Server Setup Script
# Ez a script automatikusan telepíti és konfigurálja a NutriChef alkalmazást

set -e  # Kilép hiba esetén

echo "🍳 NutriChef Ubuntu Server Setup"
echo "================================="
echo ""

# Színek a terminál kimenethez
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ellenőrzések
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Futtasd sudo-val: sudo ./setup.sh${NC}"
    exit 1
fi

# Kérj be domain nevet
read -p "Add meg a domain neved (pl. nutrichef.example.com): " DOMAIN
read -p "Add meg az email címed (SSL tanúsítványhoz): " EMAIL
read -p "Add meg a GitHub repository URL-t: " REPO_URL

echo ""
echo "📦 1. Függőségek telepítése..."
apt-get update
apt-get install -y curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx

# Node.js 20 telepítése
echo "📦 Node.js 20 telepítése..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Docker telepítése
echo "🐳 Docker telepítése..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Docker Compose telepítése
echo "🐳 Docker Compose telepítése..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

echo ""
echo "🗄️  2. PostgreSQL adatbázis beállítása..."
sudo -u postgres psql <<EOF
CREATE DATABASE nutrichef;
CREATE USER nutrichef WITH ENCRYPTED PASSWORD 'ChangeThisPassword123!';
GRANT ALL PRIVILEGES ON DATABASE nutrichef TO nutrichef;
\q
EOF

echo ""
echo "📁 3. Projekt letöltése..."
mkdir -p /var/www
cd /var/www
if [ -d "nutrichef" ]; then
    echo "A nutrichef mappa már létezik, frissítés..."
    cd nutrichef
    git pull
else
    git clone "$REPO_URL" nutrichef
    cd nutrichef
fi

echo ""
echo "🔐 4. Environment változók beállítása..."

# Backend .env
cat > backend/.env <<EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://nutrichef:ChangeThisPassword123!@localhost:5432/nutrichef?schema=public

JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
SESSION_EXPIRY=7d
ACCESS_TOKEN_EXPIRY=15m

FRONTEND_URL=https://$DOMAIN
ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN

GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_optional

UPLOAD_DIR=./uploads/inventory
MAX_FILE_SIZE=10485760
EOF

# Frontend .env
cat > frontend/.env <<EOF
VITE_API_URL=https://$DOMAIN/api
VITE_APP_NAME=NutriChef
EOF

echo -e "${YELLOW}⚠️  NE FELEJTSD EL frissíteni az AI API kulcsokat a backend/.env fájlban!${NC}"

echo ""
echo "📦 5. Függőségek telepítése és build..."

# Backend
cd backend
npm ci --production
npx prisma generate
npx prisma migrate deploy
cd ..

# Frontend
cd frontend
npm ci
npm run build
cd ..

echo ""
echo "🔧 6. Systemd service beállítása..."

cat > /etc/systemd/system/nutrichef-backend.service <<EOF
[Unit]
Description=NutriChef Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/nutrichef/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable nutrichef-backend
systemctl start nutrichef-backend

echo ""
echo "🌐 7. Nginx beállítása..."

cat > /etc/nginx/sites-available/nutrichef <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    root /var/www/nutrichef/frontend/dist;
    index index.html;

    # Frontend
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    client_max_body_size 10M;
}
EOF

ln -sf /etc/nginx/sites-available/nutrichef /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo ""
echo "🔒 8. SSL tanúsítvány beszerzése..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

echo ""
echo "✅ Telepítés kész!"
echo ""
echo "🎉 A NutriChef elérhető itt: https://$DOMAIN"
echo ""
echo "📝 Következő lépések:"
echo "  1. Frissítsd az AI API kulcsokat: nano /var/www/nutrichef/backend/.env"
echo "  2. Indítsd újra a backend-et: sudo systemctl restart nutrichef-backend"
echo "  3. Ellenőrizd a logokat: sudo journalctl -u nutrichef-backend -f"
echo ""
echo "🔧 Hasznos parancsok:"
echo "  - Backend újraindítás: sudo systemctl restart nutrichef-backend"
echo "  - Backend status: sudo systemctl status nutrichef-backend"
echo "  - Backend logok: sudo journalctl -u nutrichef-backend -f"
echo "  - Nginx újraindítás: sudo systemctl restart nginx"
echo "  - SSL megújítás: sudo certbot renew"
echo ""
