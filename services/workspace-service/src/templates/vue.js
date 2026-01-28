export default {
  id: 'vue-app',
  name: 'Vue.js',
  image: 'node:20-alpine',
  language: 'javascript',
  entrypoint: ['sh'],
  cmd: ['-c', 'tail -f /dev/null'],
  port: 5173,
  // Using npm create vite@latest for consistency
  setupScript: `
if [ ! -f package.json ]; then 
  npm create vite@latest . -- --template vue --yes
fi

if [ ! -d node_modules ]; then
  echo "📥 Installing dependencies..."
  npm install
fi

# Create start.sh
cat > start.sh << 'EOF'
#!/bin/sh
set -e
export CHOKIDAR_USEPOLLING=true

echo "🧹 Ensuring port 5173 is free..."
# 1. Try fuser
fuser -k 5173/tcp > /dev/null 2>&1 || true
# 2. Try lsof
if command -v lsof >/dev/null; then
    lsof -t -i:5173 | xargs -r kill -9 > /dev/null 2>&1 || true
fi
# 3. Fallback: netstat
PID=$(netstat -lnp 2>/dev/null | grep ':5173 ' | awk '{print $NF}' | cut -d'/' -f1)
if [ -n "$PID" ] && [ "$PID" != "-" ]; then kill -9 "$PID" 2>/dev/null || true; fi

# Wait for port release
for i in 1 2 3 4 5; do
    if ! netstat -lnp 2>/dev/null | grep -q ':5173 '; then break; fi
    sleep 1
done

echo ""
echo "================================================================="
echo "   🟢  V U E   D E V   S E R V E R   (Vite)"
echo "================================================================="
echo "   📝  Logs will appear below..."
echo ""

exec npm run dev -- --host 0.0.0.0 --port 5173
EOF
chmod +x start.sh
`,
  startCommand: './start.sh'
};
