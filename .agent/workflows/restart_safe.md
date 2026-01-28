---
description: Safely restart Docker services without deleting data volumes
---

This workflow restarts your application while preserving your database and workspace data.

1. Stop containers (preserving volumes):
```powershell
docker-compose down
```
// turbo

2. Start containers again:
```powershell
docker-compose up -d --build
```
// turbo
