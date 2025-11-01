# NutriChef Deployment Gyors Referencia

## 🚀 Első Telepítés

### 1. GitHub Secrets Beállítása

```
Settings → Secrets and variables → Actions
```

Szükséges secrets:

- `SERVER_HOST` - Szerver IP vagy domain
- `SERVER_USER` - SSH felhasználó (általában root)
- `SSH_PRIVATE_KEY` - SSH private key
- `SERVER_PORT` - SSH port (opcionális, default: 22)

### 2. SSH Kulcs Generálása

```bash
# Helyi gépen
ssh-keygen -t ed25519 -C "github-actions"
cat ~/.ssh/id_ed25519      # Private key → GitHub Secret
cat ~/.ssh/id_ed25519.pub  # Public key → szerver

# Szerveren
mkdir -p ~/.ssh
echo "PUBLIC_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 3. Szerver Előkészítése

```bash
# SSH a szerverre
ssh root@your-server-ip

# Projekt klónozása
git clone https://github.com/AFekexd/NutriChef.git
cd NutriChef

# Setup futtatása
chmod +x setup.sh
sudo ./setup.sh
```

### 4. API Kulcsok

```bash
# Szerkesztés
nano /var/www/nutrichef/backend/.env

# Frissítendő értékek:
GEMINI_API_KEY=your_actual_key
OPENAI_API_KEY=your_actual_key (optional)

# Újraindítás
sudo systemctl restart nutrichef-backend
```

## 📦 Deployment

### Automatikus (GitHub Actions)

```bash
git add .
git commit -m "feat: új funkció"
git push origin main
# → Automatikusan települ!
```

### Manuális

```bash
# Szerveren
cd /var/www/nutrichef
git pull origin main

# Backend
cd backend
npm ci --production
npx prisma generate
npx prisma migrate deploy
npm run build
sudo systemctl restart nutrichef-backend

# Frontend
cd ../frontend
npm ci
npm run build
sudo systemctl restart nginx
```

## 🔧 Gyakori Parancsok

### Backend

```bash
# Újraindítás
sudo systemctl restart nutrichef-backend

# Status
sudo systemctl status nutrichef-backend

# Logok
sudo journalctl -u nutrichef-backend -f

# Hibák
sudo journalctl -u nutrichef-backend -p err
```

### Nginx

```bash
# Újraindítás
sudo systemctl restart nginx

# Teszt
sudo nginx -t

# Logok
sudo tail -f /var/log/nginx/error.log
```

### PostgreSQL

```bash
# Kapcsolódás
sudo -u postgres psql nutrichef

# Backup
sudo -u postgres pg_dump nutrichef > backup_$(date +%Y%m%d).sql

# Restore
sudo -u postgres psql nutrichef < backup.sql
```

### SSL

```bash
# Megújítás
sudo certbot renew

# Status
sudo certbot certificates
```

## 🐳 Docker (Alternatív)

```bash
# Indítás
docker-compose up -d --build

# Logok
docker-compose logs -f

# Újraindítás
docker-compose restart

# Leállítás
docker-compose down
```

## 🐛 Hibaelhárítás

### Backend nem indul

```bash
sudo journalctl -u nutrichef-backend -n 50
cat /var/www/nutrichef/backend/.env
sudo lsof -i :5000
```

### Nginx 502

```bash
sudo systemctl status nutrichef-backend
sudo netstat -tlnp | grep 5000
sudo tail -f /var/log/nginx/error.log
```

### DB Connection Error

```bash
sudo systemctl status postgresql
psql -U nutrichef -d nutrichef -h localhost
```

## 📊 Monitoring

```bash
# System
htop
df -h

# Application
curl http://localhost:5000/api/health
sudo systemctl status nutrichef-backend
sudo systemctl status nginx
```

## 🔒 Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

---

**Teljes dokumentáció:** Lásd DEPLOYMENT.md
