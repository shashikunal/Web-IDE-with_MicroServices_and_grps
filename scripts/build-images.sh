#!/bin/bash
echo "🐳 Building Docker images..."

docker build -t playground-node - <<'EOF'
FROM node:18-bookworm-slim
EOF

docker build -t playground-python - <<'EOF'
FROM python:3.11-bookworm
EOF

docker build -t playground-gcc - <<'EOF'
FROM gcc:12-bookworm
EOF

docker build -t playground-go - <<'EOF'
FROM golang:1.21-bookworm
EOF

echo "✅ Images built!"
docker images | grep playground
