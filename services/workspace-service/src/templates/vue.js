export default {
  id: 'vue-app',
  name: 'Vue.js',
  image: 'node:20-alpine',
  language: 'javascript',
  entrypoint: 'sh',
  cmd: ['-c', 'tail -f /dev/null'],
  port: 5173,
  // Using npm create vite@latest for consistency
  setupScript: 'if [ ! -f package.json ]; then npm create vite@latest . -- --template vue --yes; fi && npm install',
  startCommand: 'npm run dev -- --host 0.0.0.0'
};
