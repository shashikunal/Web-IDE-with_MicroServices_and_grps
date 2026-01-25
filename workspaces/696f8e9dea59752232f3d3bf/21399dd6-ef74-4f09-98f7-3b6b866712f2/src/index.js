const app = require('./app');
const config = require('./config');

const PORT = config.port || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});