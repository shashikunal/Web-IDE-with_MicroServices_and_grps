export default {
  id: 'angular',
  name: 'Angular',
  image: 'node:20-alpine',
  language: 'typescript',
  entrypoint: ['sh'],
  cmd: ['-c', 'tail -f /dev/null'],
  port: 4200,
  setupScript: `
# Exit on error, treat unset variables as error
set -eu
export NG_CLI_ANALYTICS=false

# Redirect output to install.log for debugging (optional)
exec >> install.log 2>&1

# 1. Install System Dependencies (Alpine specific)
echo "📦 Installing system utilities..."
apk add --no-cache curl procps lsof psmisc

# 2. Scaffolding Logic
if [ ! -f package.json ]; then
    echo "🔨 Scaffolding fresh Angular project..."
    npx -p @angular/cli@18 ng new angular-app \
        --directory ./ \
        --style css \
        --routing \
        --skip-git \
        --skip-install \
        --standalone false \
        --defaults
    echo "✅ Scaffolding complete."
fi

# 3. Dependency Sync
if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
    echo "📥 Syncing dependencies (this may take a few minutes)..."
    npm install --no-audit --no-fund --no-progress
    
    if [ -d "node_modules/esbuild" ]; then
        npm rebuild esbuild > /dev/null 2>&1 || true
    fi
fi

# 4. Create Angular configuration for container environment
echo "⚙️ Optimizing Angular configuration for container environment..."
if [ -f "angular.json" ]; then
    sed -i 's/"progress": true/"progress": false/g' angular.json || true
    sed -i 's/"poll": [0-9]*/"poll": 2000/g' angular.json || true
    sed -i 's/"buildOptimizer": false/"buildOptimizer": true/g' angular.json || true
fi

# 5. Create the Startup Script
# This is created ONLY after dependencies are installed, blocking the UI at 90% until ready.
cat << 'EOF' > start.sh
#!/bin/sh
set -e
export NG_CLI_ANALYTICS=false
export NODE_OPTIONS="--max-old-space-size=2048"

# Clean up port 4200 with robust checks
echo "🧹 Ensuring port 4200 is free..."

# 1. Try fuser (force kill)
fuser -k 4200/tcp > /dev/null 2>&1 || true

# 2. Try lsof
if command -v lsof >/dev/null; then
    lsof -t -i:4200 | xargs -r kill -9 > /dev/null 2>&1 || true
fi

# 3. Fallback: netstat lookup
PID=$(netstat -lnp 2>/dev/null | grep ':4200 ' | awk '{print $NF}' | cut -d'/' -f1)
if [ -n "$PID" ] && [ "$PID" != "-" ]; then 
    kill -9 "$PID" 2>/dev/null || true
fi

# Wait for port to actually release
for i in 1 2 3 4 5; do
    if ! netstat -lnp 2>/dev/null | grep -q ':4200 '; then
        break
    fi
    echo "   Thinking... (cleaning port)"
    sleep 1
done

echo "✨ Port 4200 is ready."

# Default to development if ENV_MODE is not set
MODE=\${ENV_MODE:-development}

echo ""
echo "================================================================="
echo "   🚀  A N G U L A R   D E V   S E R V E R   ($MODE)"
echo "================================================================="
echo "   📝  Logs will appear below..."
echo ""

# Create status file for health checking
echo "starting" > /tmp/angular.status

# Execute Angular
if [ "$MODE" = "production" ]; then
    ./node_modules/.bin/ng serve \
        --host 0.0.0.0 \
        --port 4200 \
        --configuration production \
        --disable-host-check \
        --watch=false \
        --verbose=false &
else
    # Development Mode with HMR
    ./node_modules/.bin/ng serve \
        --host 0.0.0.0 \
        --port 4200 \
        --disable-host-check \
        --public-host "0.0.0.0:4200" \
        --poll 2000 \
        --live-reload true \
        --hmr true \
        --verbose=false &
fi

NG_PID=$!
echo "Angular CLI started with PID: $NG_PID"

# Health check loop
MAX_WAIT=120
WAIT_COUNT=0
echo "â³ Waiting for Angular server to be ready..."

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if curl --output /dev/null --silent --head --fail http://localhost:4200 2>/dev/null; then
        echo "âœ… Angular server is LIVE and reachable!"
        echo "ready" > /tmp/angular.status
        break
    fi

    if ! kill -0 $NG_PID 2>/dev/null; then
        echo "âŒ Angular process died unexpectedly"
        echo "failed" > /tmp/angular.status
        exit 1
    fi
    
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))

    if [ $((WAIT_COUNT % 20)) -eq 0 ]; then
        echo "â³ Still waiting... ($WAIT_COUNT/$MAX_WAIT seconds)"
    fi
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "âš ï¸ Timeout waiting for Angular server"
    echo "timeout" > /tmp/angular.status
fi

wait $NG_PID
EOF

chmod +x start.sh

# Create a health check script for external monitoring
cat << 'EOF' > health-check.sh
#!/bin/sh
if [ -f "/tmp/angular.status" ]; then
    cat /tmp/angular.status
else
    echo "unknown"
fi
EOF

chmod +x health-check.sh
`,
  startCommand: './start.sh'
};
