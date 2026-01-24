export default {
  id: 'nextjs',
  name: 'Next.js',
  image: 'node:20-alpine',
  language: 'typescript',
  entrypoint: 'sh',
  cmd: ['-c', 'tail -f /dev/null'],
  port: 3000,
  setupScript: 'if [ ! -f package.json ]; then npx create-next-app@latest . --use-npm --no-git --ts --eslint --tailwind --src-dir --app --import-alias "@/*" --yes; fi && npm install',
  startCommand: 'npm run dev -- -H 0.0.0.0'
};
