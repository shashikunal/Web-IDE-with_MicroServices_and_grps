---
description: Run the full stack (Frontend, Backend, Database) in Docker
---

This workflow starts the application using Docker Compose. This allows running the backend in a Linux environment, which supports `node-pty`, solving Windows compatibility issues.

1. Ensure Docker Desktop is running.

2. Build and start the containers:
```powershell
docker-compose up --build
```
// turbo

3. Access the application:
   - Frontend: [http://localhost:5174](http://localhost:5174)
   - Backend API: [http://localhost:3001](http://localhost:3001)

4. To stop the application:
   Press `Ctrl+C` in the terminal or run:
```powershell
docker-compose down
```

### Notes
- The Backend is mounted with hot-reloading enabled. Changes to `backend/src` will restart the server automatically.
- The Frontend is running a production build (Nginx). For frontend development, it is recommended to run `npm run dev` in the `frontend` folder on your host machine (Windows) while keeping the backend running in Docker.
