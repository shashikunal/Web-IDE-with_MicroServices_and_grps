export default {
  id: 'vue-app',
  name: 'Vue.js',
  image: 'node:20-alpine',
  language: 'javascript',
  entrypoint: 'sh',
  cmd: ['-c', 'tail -f /dev/null'],
  port: 5173,
  // Using npm create vue@latest
  setupScript: 'if [ ! -f package.json ]; then npm create vue@latest . -- --default --yes; fi && npm install'
};
