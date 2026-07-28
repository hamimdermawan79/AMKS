#!/bin/bash
set -e

# =============================================================================
# AMKS Production Deploy Script
# Repo: git@github.com:hamimdermawan79/AMKS.git
# OS: Ubuntu 24.04
# Domain: amksyogyakarta.my.id
# Tunnel ID: 28775a88-5ec6-47af-8134-5f249ea1780f
# =============================================================================

APP_DIR="/var/www/amks"
REPO_URL="git@github.com:hamimdermawan79/AMKS.git"
BRANCH="Production"
DOMAIN="amksyogyakarta.my.id"
TUNNEL_ID="28775a88-5ec6-47af-8134-5f249ea1780f"

echo "========================================"
echo "  AMKS Production Deploy"
echo "========================================"

# --- 1. System update & base deps -------------------------------------------
echo "[1/9] Updating system and installing base dependencies..."
sudo apt-get update -y
sudo apt-get install -y curl wget gnupg2 ca-certificates lsb-release software-properties-common git build-essential libpq-dev

# --- 2. Node.js 20 ----------------------------------------------------------
echo "[2/9] Installing Node.js 20..."
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" != "20" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
    sudo apt-get install -y nodejs
fi
node -v
npm -v

# --- 3. PostgreSQL ----------------------------------------------------------
echo "[3/9] Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
fi

# Create DB and user
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='amks'" | grep -q 1 || \
    sudo -u postgres createdb amks
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='amks'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER amks WITH ENCRYPTED PASSWORD 'amks_secure_$(openssl rand -hex 4)';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE amks TO amks;"
sudo -u postgres psql -c "ALTER DATABASE amks OWNER TO amks;"

DB_PASS=$(sudo -u postgres psql -Atc "SELECT passwd FROM pg_shadow WHERE usename='amks';")

# --- 4. PM2 -----------------------------------------------------------------
echo "[4/9] Installing PM2..."
sudo npm install -g pm2

# --- 5. Cloudflared ---------------------------------------------------------
echo "[5/9] Installing cloudflared..."
if ! command -v cloudflared &> /dev/null; then
    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i cloudflared.deb
    rm -f cloudflared.deb
fi

# --- 6. Clone / update repo -------------------------------------------------
echo "[6/9] Cloning / updating repository..."
if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/$BRANCH
else
    sudo mkdir -p "$APP_DIR"
    sudo chown -R $USER:$USER "$APP_DIR"
    git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# --- 7. Environment & secrets -----------------------------------------------
echo "[7/9] Setting up environment..."
AUTH_SECRET=$(openssl rand -base64 32)
CRON_SECRET=$(openssl rand -hex 16)

if [ ! -f .env ]; then
    cat > .env <<EOF
DATABASE_URL=postgresql://amks:${DB_PASS}@localhost:5432/amks
AUTH_SECRET=${AUTH_SECRET}
CRON_SECRET=${CRON_SECRET}
EOF
    echo ".env created."
else
    echo ".env already exists, skipping creation (review manually if needed)."
fi

# --- 8. Build ---------------------------------------------------------------
echo "[8/9] Installing dependencies and building..."
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# --- 9. PM2 ecosystem & start -----------------------------------------------
echo "[9/9] Starting with PM2..."
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'amks',
    cwd: '${APP_DIR}',
    script: 'node_modules/.bin/next',
    args: 'start',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: '/var/log/pm2/amks.log',
    error_file: '/var/log/pm2/amks-error.log',
    out_file: '/var/log/pm2/amks-out.log',
    merge_logs: true,
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

sudo mkdir -p /var/log/pm2

# Save PM2 startup script
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
pm2 start ecosystem.config.js
pm2 save

# --- Cloudflare Tunnel ------------------------------------------------------
echo ""
echo "========================================"
echo "  Cloudflare Tunnel Setup"
echo "========================================"
echo ""
echo "Tunnel ID: $TUNNEL_ID"
echo ""
echo "You need the tunnel TOKEN to run it headless."
echo "Get it from: https://dash.cloudflare.com → Zero Trust → Networks → Tunnels"
echo "Click the tunnel → copy token (starts with 'eyJ...')"
echo ""
echo "Then run on this server:"
echo "  cloudflared tunnel run --token <YOUR_TOKEN> $TUNNEL_ID"
echo ""
echo "Or create a systemd service:"
echo "  sudo cloudflared service install <YOUR_TOKEN>"
echo ""

# Create a helper script for when token is ready
cat > "$APP_DIR/run-tunnel.sh" <<'EOF'
#!/bin/bash
# Usage: ./run-tunnel.sh <TOKEN>
TOKEN=$1
TUNNEL_ID="28775a88-5ec6-47af-8134-5f249ea1780f"
if [ -z "$TOKEN" ]; then
    echo "Usage: ./run-tunnel.sh <cloudflared-token>"
    exit 1
fi
sudo cloudflared service install "$TOKEN"
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
echo "Tunnel started."
EOF
chmod +x "$APP_DIR/run-tunnel.sh"

echo "========================================"
echo "  Deploy Complete!"
echo "========================================"
echo "App running on: http://localhost:3000"
echo "PM2 status:   pm2 status"
echo "Logs:         pm2 logs amks"
echo "Env file:     $APP_DIR/.env"
echo "DB pass:      $DB_PASS"
echo ""
echo "Next step: run ./run-tunnel.sh <TOKEN> after getting token from Cloudflare dashboard"
