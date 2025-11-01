# 🍳 NutriChef - Ubuntu Server Deployment Útmutató

Ez az útmutató végigvezet a NutriChef alkalmazás telepítésén és konfigurálásán egy Ubuntu szerveren.

## 📋 Követelmények

- Ubuntu 20.04 vagy újabb
- Minimum 2 GB RAM
- 20 GB szabad tárhely
- Domain név (DNS beállítva a szerver IP-jére)
- Root/sudo hozzáférés

## 🚀 Gyors Telepítés (Automatikus)

### 1. GitHub Repository Secrets Beállítása

A GitHub repository Settings → Secrets and variables → Actions menüpontban add hozzá:

```
SERVER_HOST=your-server-ip-or-domain
SERVER_USER=root
SSH_PRIVATE_KEY=your-ssh-private-key
SERVER_PORT=22 (optional, default: 22)
```

**SSH kulcs generálása:**

```bash
# Helyi gépen
ssh-keygen -t ed25519 -C "github-actions"
cat ~/.ssh/id_ed25519  # Ez a private key (GitHub Secret)
cat ~/.ssh/id_ed25519.pub  # Ez a public key (szerverre másolni)

# Szerveren
mkdir -p ~/.ssh
echo "your-public-key" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 2. Első Telepítés a Szerveren

Jelentkezz be a szerverre SSH-n keresztül:

```bash
ssh root@your-server-ip
```

Töltsd le és futtasd a setup scriptet:

```bash
# Projekt letöltése
git clone https://github.com/AFekexd/NutriChef.git
cd NutriChef

# Setup script futtatása
chmod +x setup.sh
sudo ./setup.sh
```

A script megkérdezi:

- Domain név
- Email cím (SSL tanúsítványhoz)
- GitHub repository URL

### 3. API Kulcsok Beállítása

Szerkeszd a backend environment fájlt:

```bash
nano /var/www/nutrichef/backend/.env
```

Frissítsd az alábbi értékeket:

```env
GEMINI_API_KEY=your_actual_gemini_api_key
OPENAI_API_KEY=your_actual_openai_api_key (optional)
```

Mentés után indítsd újra a backend-et:

```bash
sudo systemctl restart nutrichef-backend
```

### 4. Automatikus Deployment

Mostantól minden push a `main` branchre automatikusan telepíti az alkalmazást!

```bash
git add .
git commit -m "feat: új funkció"
git push origin main
```

A GitHub Actions automatikusan:

- ✅ Build-eli a frontend-et
- ✅ SSH-zik a szerverre
- ✅ Frissíti a kódot (git pull)
- ✅ Telepíti a függőségeket
- ✅ Futtatja a Prisma migrációkat
- ✅ Build-eli a frontend-et
- ✅ Újraindítja a szolgáltatásokat

---

## 🔧 Manuális Telepítés

Ha nem szeretnéd az automatikus telepítést használni:

### 1. Függőségek Telepítése

```bash
# Rendszer frissítése
sudo apt-get update && sudo apt-get upgrade -y

# Node.js 20 telepítése
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL telepítése
sudo apt-get install -y postgresql postgresql-contrib

# Nginx telepítése
sudo apt-get install -y nginx

# Certbot (SSL) telepítése
sudo apt-get install -y certbot python3-certbot-nginx
```

### 2. PostgreSQL Adatbázis

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE nutrichef;
CREATE USER nutrichef WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE nutrichef TO nutrichef;
\q
```

### 3. Projekt Telepítése

```bash
# Projekt mappa létrehozása
sudo mkdir -p /var/www/nutrichef
cd /var/www/nutrichef

# Repository klónozása
sudo git clone https://github.com/AFekexd/NutriChef.git .

# Environment változók beállítása
sudo cp backend/.env.example backend/.env
sudo cp frontend/.env.example frontend/.env

# Szerkeszd az .env fájlokat
sudo nano backend/.env
sudo nano frontend/.env
```

### 4. Backend Telepítése

```bash
cd /var/www/nutrichef/backend

# Függőségek telepítése
sudo npm ci --production

# Prisma generálás és migrációk
sudo npx prisma generate
sudo npx prisma migrate deploy

# TypeScript build
sudo npm run build
```

### 5. Frontend Telepítése

```bash
cd /var/www/nutrichef/frontend

# Függőségek telepítése
sudo npm ci

# Production build
sudo npm run build
```

### 6. Systemd Service

Hozd létre a systemd service fájlt:

```bash
sudo nano /etc/systemd/system/nutrichef-backend.service
```

```ini
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
```

Indítsd el a szolgáltatást:

```bash
sudo systemctl daemon-reload
sudo systemctl enable nutrichef-backend
sudo systemctl start nutrichef-backend
sudo systemctl status nutrichef-backend
```

### 7. Nginx Konfiguráció

Hozd létre az Nginx konfigurációt:

```bash
sudo nano /etc/nginx/sites-available/nutrichef
```

Másold be a `nginx.conf` tartalmát, majd:

```bash
# Szimbolikus link létrehozása
sudo ln -s /etc/nginx/sites-available/nutrichef /etc/nginx/sites-enabled/

# Default site eltávolítása
sudo rm /etc/nginx/sites-enabled/default

# Konfiguráció tesztelése
sudo nginx -t

# Nginx újraindítása
sudo systemctl restart nginx
```

### 8. SSL Tanúsítvány (Let's Encrypt)

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Az SSL automatikus megújítása:

```bash
sudo certbot renew --dry-run
```

---

## 🐳 Docker Deployment (Alternatív)

Ha Docker-rel szeretnéd futtatni:

### 1. Docker Telepítése

```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker
sudo systemctl start docker

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Environment Változók

```bash
cd /var/www/nutrichef
cp .env.example .env
nano .env
```

Töltsd ki az értékeket!

### 3. Konténerek Indítása

```bash
# Build és indítás
docker-compose up -d --build

# Logok megtekintése
docker-compose logs -f

# Leállítás
docker-compose down

# Újraindítás
docker-compose restart
```

### 4. SSL Docker-rel

Használd a `nginx-proxy` és `letsencrypt-companion` konténereket, vagy manuálisan állítsd be az SSL-t.

---

## 🔧 Karbantartás

### Backend Újraindítása

```bash
sudo systemctl restart nutrichef-backend
```

### Backend Logok

```bash
# Valós idejű logok
sudo journalctl -u nutrichef-backend -f

# Utolsó 100 sor
sudo journalctl -u nutrichef-backend -n 100

# Hibák szűrése
sudo journalctl -u nutrichef-backend -p err
```

### Frontend Újra-build

```bash
cd /var/www/nutrichef/frontend
sudo npm run build
sudo systemctl restart nginx
```

### Adatbázis Backup

```bash
# Backup létrehozása
sudo -u postgres pg_dump nutrichef > nutrichef_backup_$(date +%Y%m%d).sql

# Visszaállítás
sudo -u postgres psql nutrichef < nutrichef_backup_20250101.sql
```

### Prisma Migrációk

```bash
cd /var/www/nutrichef/backend

# Új migráció futtatása
sudo npx prisma migrate deploy

# Migráció status
sudo npx prisma migrate status

# Prisma Studio (fejlesztéshez)
sudo npx prisma studio
```

### SSL Tanúsítvány Megújítása

```bash
# Manuális megújítás
sudo certbot renew

# Tesztelés
sudo certbot renew --dry-run
```

---

## 📊 Monitoring

### Backend Health Check

```bash
curl http://localhost:5000/api/health
```

### Nginx Status

```bash
sudo systemctl status nginx
sudo nginx -t
```

### PostgreSQL Status

```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"
```

### Disk Usage

```bash
df -h
du -sh /var/www/nutrichef
```

---

## 🔒 Biztonság

### Firewall Beállítása (UFW)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

### Fail2Ban (SSH védelem)

```bash
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### PostgreSQL Biztonság

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Csak localhost hozzáférést engedélyezz!

---

## 🐛 Hibaelhárítás

### Backend nem indul

```bash
# Logok ellenőrzése
sudo journalctl -u nutrichef-backend -n 50

# Environment változók ellenőrzése
cat /var/www/nutrichef/backend/.env

# Node.js verzió ellenőrzése
node --version  # Kell: v20+

# Port foglaltság ellenőrzése
sudo lsof -i :5000
```

### Adatbázis kapcsolat hiba

```bash
# PostgreSQL fut?
sudo systemctl status postgresql

# Kapcsolat tesztelése
psql -U nutrichef -d nutrichef -h localhost

# DATABASE_URL helyes?
cat /var/www/nutrichef/backend/.env | grep DATABASE_URL
```

### Nginx 502 Bad Gateway

```bash
# Backend fut?
sudo systemctl status nutrichef-backend

# Backend port hallgat?
sudo netstat -tlnp | grep 5000

# Nginx error log
sudo tail -f /var/log/nginx/error.log
```

### SSL probléma

```bash
# Certbot logok
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# SSL tanúsítvány ellenőrzése
sudo certbot certificates

# Megújítás
sudo certbot renew --force-renewal
```

---

## 📞 Támogatás

Ha problémába ütközöl:

1. Ellenőrizd a logokat
2. Nézd meg a GitHub Issues-t
3. Hozz létre új Issue-t részletes leírással

## 📝 Licenc

MIT License - Használd szabadon!

---

**Készítette:** AFekexd  
**Utolsó frissítés:** 2025. November 1.
