export default {
  id: 'html-site',
  name: 'HTML',
  image: 'nginx:alpine',
  language: 'html',
  entrypoint: 'sh',
  cmd: ['-c', 'cp -r /workspace/* /usr/share/nginx/html && nginx -g "daemon off;"'],
  port: 80,
  files: {
    'index.html': '<!DOCTYPE html><html><head><title>Static Site</title></head><body><h1>Hello from HTML!</h1></body></html>',
    'style.css': 'body { font-family: sans-serif; padding: 20px; }',
    'app.js': 'console.log("Hello from JavaScript!");'
  },
  setupScript: null
};
