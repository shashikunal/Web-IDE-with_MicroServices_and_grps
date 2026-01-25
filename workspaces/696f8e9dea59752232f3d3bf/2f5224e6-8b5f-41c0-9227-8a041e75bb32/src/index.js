const app = require('./app');
const config = require('./config');

const PORT = config.port || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. Server is likely running in background.`);
  } else {
    console.error(err);
  }
});