export default {
  id: 'angular',
  name: 'Angular',
  image: 'node:20-alpine',
  language: 'typescript',
  entrypoint: 'sh',
  cmd: ['-c', 'tail -f /dev/null'],
  port: 4200,
  setupScript: 'npm install -g @angular/cli && if [ ! -f angular.json ]; then ng new my-app --directory . --defaults --skip-git --skip-install; fi && npm install',
  startCommand: 'ng serve --project my-app --host 0.0.0.0 --allowed-hosts=all --poll 2000'
};
