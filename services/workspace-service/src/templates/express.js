export default {
  id: 'express-app',
  name: 'Express.js',
  type: 'framework',
  image: 'node:20-alpine',
  language: 'javascript',
  compiler: null,
  interpreter: 'node',
  runtime: 'node',
  entrypoint: 'sh',
  cmd: ['-c', 'npm install && npm start'],
  port: 3000,
  startCommand: 'npm start',
  files: {
    'package.json': JSON.stringify({
      name: 'express-starter',
      version: '1.0.0',
      main: 'src/index.js',
      scripts: {
        start: 'nodemon -L src/index.js',
        dev: 'nodemon -L src/index.js',
        test: 'echo \"Error: no test specified\" && exit 1'
      },
      dependencies: {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "dotenv": "^16.3.1",
        "morgan": "^1.10.0",
        "helmet": "^7.1.0"
      },
      devDependencies: {
        "nodemon": "^3.0.2"
      }
    }, null, 2),
    'src/index.js': `const app = require('./app');
const config = require('./config');

const PORT = config.port || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server is running on port \${PORT}\`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(\`Port \${PORT} is already in use. Server is likely running.\`);
  } else {
    console.error(err);
  }
});`,
    'src/app.js': `const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Base route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Express.js Starter API',
    status: 'running',
    timestamp: new Date()
  });
});

// Error Handling
app.use(errorHandler);

module.exports = app;`,
    'src/config.js': `require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development'
};`,
    'src/routes/index.js': `const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

router.get('/users', usersController.getAllUsers);
router.post('/users', usersController.createUser);
router.get('/health', (req, res) => res.json({ status: 'OK' }));

module.exports = router;`,
    'src/controllers/usersController.js': `// Simple in-memory storage for demonstration
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

exports.getAllUsers = (req, res) => {
  res.json({
    success: true,
    data: users
  });
};

exports.createUser = (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name and email'
    });
  }

  const newUser = {
    id: users.length + 1,
    name,
    email
  };

  users.push(newUser);

  res.status(201).json({
    success: true,
    data: newUser
  });
};`,
    'src/middleware/errorHandler.js': `module.exports = (err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};`,
    '.env': 'PORT=3000\nNODE_ENV=development',
    '.gitignore': 'node_modules\n.env\n.DS_Store',
    'README.md': `# Express.js Starter Template

This is a robust boilerplate for Express.js applications.

## Features
- **Structure**: Organized into routes, controllers, and middleware.
- **Security**: Basic security with Helmet.
- **Logging**: Request logging with Morgan.
- **CORS**: Enabled by default.
- **Dev Tools**: Nodemon for hot reloading.

## Scripts
- \`npm start\`: Start the server
- \`npm run dev\`: Start in development mode with auto-reload

## API Endpoints
- GET \`/\`: Welcome message
- GET \`/api/health\`: Health check
- GET \`/api/users\`: List users
- POST \`/api/users\`: Create user
`
  },
  setupScript: 'npm install'
};
