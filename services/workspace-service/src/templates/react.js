export default {
  id: 'react-app',
  name: 'React',
  type: 'framework',
  image: 'node:20-alpine',
  language: 'typescript',
  compiler: null,
  buildTool: 'vite',
  runtime: 'node',
  entrypoint: 'sh',
  // Keep container running so we can exec commands
  cmd: ['-c', 'tail -f /dev/null'],
  port: 5173,
  setupScript: 'if [ ! -f package.json ]; then npm create vite@latest . -- --template react-ts --yes; fi && npm install',
  startCommand: 'npm run dev -- --host'
};
