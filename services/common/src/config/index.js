const config = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'coding-platform:',
    ttl: {
      default: 3600,
      user: 1800,
      session: 86400,
      workspace: 7200
    }
  },
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT) || 5672,
    username: process.env.RABBITMQ_USERNAME || 'guest',
    password: process.env.RABBITMQ_PASSWORD || 'guest',
    vhost: process.env.RABBITMQ_VHOST || '/',
    queuePrefix: process.env.RABBITMQ_QUEUE_PREFIX || 'coding_platform_',
    exchange: {
      name: process.env.RABBITMQ_EXCHANGE || 'coding_platform_events',
      type: 'topic'
    }
  },
  grpc: {
    host: process.env.GRPC_HOST || 'localhost',
    ports: {
      gateway: parseInt(process.env.GRPC_GATEWAY_PORT) || 5000,
      auth: parseInt(process.env.GRPC_AUTH_PORT) || 5001,
      user: parseInt(process.env.GRPC_USER_PORT) || 5002,
      workspace: parseInt(process.env.GRPC_WORKSPACE_PORT) || 5003,
      snippet: parseInt(process.env.GRPC_SNIPPET_PORT) || 5004,
      apitest: parseInt(process.env.GRPC_APITEST_PORT) || 5005,
      terminal: parseInt(process.env.GRPC_TERMINAL_PORT) || 5006,
      admin: parseInt(process.env.GRPC_ADMIN_PORT) || 5007
    }
  },
  services: {
    gateway: {
      host: process.env.GATEWAY_HOST || '0.0.0.0',
      port: parseInt(process.env.GATEWAY_PORT) || 3000
    },
    auth: {
      host: process.env.AUTH_HOST || '0.0.0.0',
      port: parseInt(process.env.AUTH_PORT) || 3001
    },
    user: {
      host: process.env.USER_HOST || '0.0.0.0',
      port: parseInt(process.env.USER_PORT) || 3002
    },
    workspace: {
      host: process.env.WORKSPACE_HOST || '0.0.0.0',
      port: parseInt(process.env.WORKSPACE_PORT) || 3003
    },
    snippet: {
      host: process.env.SNIPPET_HOST || '0.0.0.0',
      port: parseInt(process.env.SNIPPET_PORT) || 3004
    },
    apitest: {
      host: process.env.APITEST_HOST || '0.0.0.0',
      port: parseInt(process.env.APITEST_PORT) || 3005
    },
    terminal: {
      host: process.env.TERMINAL_HOST || '0.0.0.0',
      port: parseInt(process.env.TERMINAL_PORT) || 3006
    },
    admin: {
      host: process.env.ADMIN_HOST || '0.0.0.0',
      port: parseInt(process.env.ADMIN_PORT) || 3007
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d'
  },
  mongodb: {
    host: process.env.MONGODB_HOST || 'localhost',
    port: parseInt(process.env.MONGODB_PORT) || 27017,
    database: process.env.MONGODB_DATABASE || 'coding_platform',
    username: process.env.MONGODB_USERNAME || '',
    password: process.env.MONGODB_PASSWORD || '',
    collectionPrefix: process.env.MONGODB_COLLECTION_PREFIX || ''
  }
};

export default config;
