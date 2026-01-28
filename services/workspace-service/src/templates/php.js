export default {
  id: 'php-lang',
  name: 'PHP',
  image: 'php:8.2-cli',
  language: 'php',
  entrypoint: ['sh'],
  // Using built-in server for output visibility, or just run script
  cmd: ['-c', 'php -S 0.0.0.0:8000'],
  port: 8000,
  files: {
    'index.php': '<?php echo "Hello from PHP!"; ?>'
  },
  setupScript: null
};
