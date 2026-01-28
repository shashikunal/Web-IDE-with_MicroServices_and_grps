export default {
  id: 'react-app',
  name: 'React',
  type: 'framework',
  image: 'node:20-alpine',
  language: 'typescript',
  compiler: null,
  buildTool: 'vite',
  runtime: 'node',
  entrypoint: ['sh'],
  // Keep container running so we can exec commands
  cmd: ['-c', 'tail -f /dev/null'],
  port: 5173,
  setupScript: `
# Exit immediately if a command exits with a non-zero status
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀  Initializing React Workspace..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Configure interactive terminal welcome message
cat > /root/.profile << 'EOF'
echo ""
echo "  👋 Welcome to your React Workspace!"
echo "  🚀 Powered by Vite + Yarn"
echo ""
EOF

# 1. Scaffolding
if [ ! -f package.json ]; then 
  echo "1️⃣   Scaffolding React project..."
  # Create in temp folder to avoid "directory not empty" errors (since start.sh/etc might exist)
  npm create vite@latest temp-app -- --template react-ts --yes
  
  # Move files to root (including hidden files)
  cp -r temp-app/* . 2>/dev/null || true
  cp -r temp-app/.* . 2>/dev/null || true
  rm -rf temp-app
else
  echo "1️⃣   Project already exists (Skipping scaffolding)"
fi

# 2. Dependency Installation
if [ ! -d node_modules ] || [ ! -f node_modules/.bin/vite ]; then
  echo "2️⃣   Installing dependencies (using Yarn for speed)..."
  # Yarn is typically faster and has better caching in Docker
  yarn install
  # Rebuild esbuild if needed (sometimes required on alpine)
  if [ -f node_modules/esbuild/install.js ]; then
     node node_modules/esbuild/install.js
  fi
else
  echo "2️⃣   Dependencies already installed"
fi

echo "✅  Setup Complete! Launching Editor..."

# 3. Create Configs
cat > vite.config.ts << 'VL'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
      interval: 100
    }
  }
})
VL

# 4. Create Startup Script
cat > start.sh << 'EOF'
#!/bin/sh
set -e
export CHOKIDAR_USEPOLLING=true
export NODE_OPTIONS="--max-old-space-size=2048"

# 0. Self-Healing: scaffolding if missing
if [ ! -f package.json ]; then
  echo "⚠️ package.json missing! Running emergency scaffolding..."
  # Create in temp folder to avoid "directory not empty" errors
  npm create vite@latest temp-app -- --template react-ts --yes
  
  # Move files to root
  cp -r temp-app/* . 2>/dev/null || true
  cp -r temp-app/.* . 2>/dev/null || true
  rm -rf temp-app
  
  # Re-create config if missing
  cat > vite.config.ts << 'VL'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
      interval: 100
    }
  }
})
VL
fi

# Safety check: Install if missing
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules missing, installing..."
    yarn install
fi

echo "🧹 Ensuring port 5173 is free..."
# Try fuser (force kill) - lighter than lsof
fuser -k 5173/tcp > /dev/null 2>&1 || true

# Fallback: netstat
PID=$(netstat -lnp 2>/dev/null | grep ':5173 ' | awk '{print $NF}' | cut -d'/' -f1)
if [ -n "$PID" ] && [ "$PID" != "-" ]; then kill -9 "$PID" 2>/dev/null || true; fi

echo ""
echo "┌───────────────────────────────────────────────────┐"
echo "│  ⚛️  R E A C T   D E V   S E R V E R              │"
echo "│     (Vite + Yarn)                                 │"
echo "└───────────────────────────────────────────────────┘"
echo "   📝  Logs will appear below..."
echo ""

exec yarn run dev --host 0.0.0.0 --port 5173
EOF
chmod +x start.sh
`,
  startCommand: './start.sh'
};
