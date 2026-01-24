export default {
  id: 'node-hello',
  name: 'Node.js',
  type: 'language', // Javascript is the language, Node is the runtime.
  image: 'node:20-alpine',
  language: 'javascript',
  compiler: null,
  interpreter: 'node',
  runtime: 'node',
  entrypoint: 'sh',
  cmd: ['-c', 'tail -f /dev/null'],
  port: 3000,
  files: {
    'package.json': JSON.stringify({
      name: 'node-hello',
      version: '1.0.0',
      main: 'index.js',
      scripts: { start: 'node index.js' },
      dependencies: {
        "express": "^4.18.2",
        "cors": "^2.8.5"
      }
    }, null, 2),
    'index.js': 'const express = require("express");\nconst cors = require("cors");\nconst app = express();\n\napp.use(cors());\napp.get("/", (req, res) => res.send("Hello from Node.js!"));\n\napp.listen(3000, "0.0.0.0", () => console.log("Server running on port 3000"));'
  },
  setupScript: 'npm install'
};
