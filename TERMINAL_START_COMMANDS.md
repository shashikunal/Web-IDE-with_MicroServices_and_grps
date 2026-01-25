# Terminal Start Commands - Complete Reference

## Overview
This document lists all the auto-start commands configured for each template in the Web IDE. When a workspace is created, the main terminal automatically executes the appropriate command based on the template type.

---

## 🌐 JavaScript/TypeScript Frameworks

### React (`react-app`)
```bash
🚀 Starting React development server...
CHOKIDAR_USEPOLLING=true npm run dev -- --host 0.0.0.0 --port 5173
```
- **Port**: 5173
- **Features**: Hot reload with polling for Docker compatibility
- **Access**: `http://localhost:<publicPort>`

### Node.js (`node-hello`)
```bash
🚀 Starting Node.js application...
PORT=3000 npm start
```
- **Port**: 3000
- **Features**: Basic Node.js server
- **Access**: `http://localhost:<publicPort>`

### Next.js (`nextjs`)
```bash
🚀 Starting Next.js development server...
npm run dev
```
- **Port**: 3000 (default)
- **Features**: Full-stack React framework with SSR
- **Access**: `http://localhost:<publicPort>`

### Angular (`angular`)
```bash
🚀 Starting Angular development server...
ng serve --project my-app --host 0.0.0.0 --allowed-hosts=all --poll 2000
```
- **Port**: 4200
- **Features**: Angular CLI dev server with polling
- **Access**: `http://localhost:<publicPort>`

### Vue.js (`vue-app`)
```bash
🚀 Starting Vue.js development server...
npm run dev -- --host 0.0.0.0
```
- **Port**: 5173 (Vite default)
- **Features**: Vue 3 with Vite
- **Access**: `http://localhost:<publicPort>`

---

## 🐍 Python Frameworks

### Flask (`python-flask`)
```bash
🚀 Starting Flask server...
python app.py
```
- **Port**: 5000 (default)
- **Features**: Lightweight Python web framework
- **Access**: `http://localhost:<publicPort>`

### FastAPI (`fastapi-app`)
```bash
🚀 Starting FastAPI server...
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- **Port**: 8000
- **Features**: Modern async Python API framework with auto-reload
- **Access**: `http://localhost:<publicPort>`
- **Docs**: `http://localhost:<publicPort>/docs` (Swagger UI)

---

## 🔷 Go

### Go API (`go-api`)
```bash
🚀 Starting Go server...
go run main.go
```
- **Port**: 8080 (typical)
- **Features**: Fast compiled Go server
- **Access**: `http://localhost:<publicPort>`

---

## 📄 Static Sites

### HTML Site (`html-site`)
```bash
🚀 Starting static server...
npx serve -y -p 3000 .
```
- **Port**: 3000
- **Features**: Simple static file server
- **Access**: `http://localhost:<publicPort>`

---

## ⚙️ Compiled Languages

### C++ (`cpp-hello`)
```bash
🔨 Compiling C++ application...
g++ -o app main.cpp
✓ Compiled successfully!
🚀 Running application...
./app
```
- **Features**: Compile and run C++ code
- **Output**: Console output in terminal

### C (`c-lang`)
```bash
🔨 Compiling C application...
gcc -o app main.c
✓ Compiled successfully!
🚀 Running application...
./app
```
- **Features**: Compile and run C code
- **Output**: Console output in terminal

### Rust (`rust-lang`)
```bash
🔨 Building Rust application...
cargo build
✓ Build successful!
🚀 Running application...
cargo run
```
- **Features**: Cargo build system with safety guarantees
- **Output**: Console output in terminal

---

## ☕ JVM Languages

### Java Maven (`java-maven`)
```bash
🔨 Building Java application with Maven...
mvn clean compile
✓ Build successful!
🚀 Running application...
mvn exec:java
```
- **Features**: Maven build and execution
- **Output**: Console output in terminal

### Spring Boot (`spring-boot`)
```bash
🚀 Starting Spring Boot application...
mvn spring-boot:run
```
- **Port**: 8080 (default)
- **Features**: Enterprise Java framework
- **Access**: `http://localhost:<publicPort>`

---

## 💎 Other Languages

### Ruby (`ruby-lang`)
```bash
🚀 Running Ruby application...
ruby main.rb
```
- **Features**: Ruby script execution
- **Output**: Console output in terminal

### PHP (`php-lang`)
```bash
🚀 Starting PHP development server...
php -S 0.0.0.0:8000
```
- **Port**: 8000
- **Features**: Built-in PHP development server
- **Access**: `http://localhost:<publicPort>`

### .NET (`dotnet`)
```bash
🚀 Starting .NET application...
dotnet run
```
- **Port**: 5000/5001 (default HTTP/HTTPS)
- **Features**: .NET Core/5+/6+ application
- **Access**: `http://localhost:<publicPort>`

---

## 📋 Template ID Reference

| Template ID | Language/Framework | Default Port | Type |
|-------------|-------------------|--------------|------|
| `react-app` | React | 5173 | Web Framework |
| `node-hello` | Node.js | 3000 | Runtime |
| `nextjs` | Next.js | 3000 | Full-stack Framework |
| `angular` | Angular | 4200 | Web Framework |
| `vue-app` | Vue.js | 5173 | Web Framework |
| `python-flask` | Flask | 5000 | Web Framework |
| `fastapi-app` | FastAPI | 8000 | API Framework |
| `go-api` | Go | 8080 | API Server |
| `html-site` | HTML/CSS/JS | 3000 | Static |
| `cpp-hello` | C++ | N/A | Console |
| `c-lang` | C | N/A | Console |
| `rust-lang` | Rust | N/A | Console |
| `java-maven` | Java | N/A | Console |
| `spring-boot` | Spring Boot | 8080 | Web Framework |
| `ruby-lang` | Ruby | N/A | Console |
| `php-lang` | PHP | 8000 | Web Server |
| `dotnet` | .NET | 5000 | Web Framework |

---

## 🎨 Terminal Output Features

All start commands include:
- **Colored output** using ANSI escape codes
- **Emoji indicators** for visual clarity:
  - 🚀 = Starting/Running
  - 🔨 = Building/Compiling
  - ✓ = Success
- **Descriptive messages** for better UX

### Color Codes Used:
- `\033[1;36m` = Cyan (info messages)
- `\033[1;32m` = Green (success messages)
- `\033[0m` = Reset to default

---

## 🔧 Customization

To add or modify start commands, edit:
```
frontend/src/components/editor/hooks/useTerminalWebSocket.ts
```

Look for the `START_COMMANDS` constant and add your template ID with the appropriate command.

### Example:
```typescript
const START_COMMANDS: Record<string, string> = {
  'my-template': 'echo -e "\\n\\033[1;36m🚀 Starting my app...\\033[0m" && my-start-command'
};
```

---

## 📝 Notes

1. **Port Mapping**: The actual external port is dynamically assigned and shown in the terminal welcome message
2. **Auto-start**: Commands run automatically 1.5 seconds after terminal connection
3. **Polling**: Some frameworks use polling for file watching in Docker environments
4. **Host Binding**: Development servers bind to `0.0.0.0` for Docker accessibility

---

**Last Updated**: 2026-01-24
**Total Templates Supported**: 17
**File Location**: `frontend/src/components/editor/hooks/useTerminalWebSocket.ts`
