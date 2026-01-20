import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../logger/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GrpcHelper {
  constructor() {
    this.clients = new Map();
    this.servers = new Map();
  }

  loadProto(protoFile, packageName) {
    const protoPath = path.resolve(__dirname, `../../../protos/${protoFile}`);

    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    });

    return grpc.loadPackageDefinition(packageDefinition)[packageName];
  }

  async createServer(port, credentials = grpc.ServerCredentials.createInsecure()) {
    const server = new grpc.Server();
    this.servers.set(port, server);

    return new Promise((resolve, reject) => {
      server.bindAsync(`0.0.0.0:${port}`, credentials, (error, boundPort) => {
        if (error) {
          logger.error(`Failed to bind gRPC server on port ${port}:`, error);
          reject(error);
          return;
        }
        logger.info(`gRPC server bound on port ${boundPort}`);
        resolve(server);
      });
    });
  }

  createClient(port, packageName, serviceName, credentials = grpc.credentials.createInsecure()) {
    const client = new packageName[serviceName](
      `localhost:${port}`,
      credentials
    );

    this.clients.set(`${port}:${serviceName}`, client);
    logger.info(`gRPC client created for ${serviceName} on port ${port}`);

    return client;
  }

  createAsyncClient(port, packageName, serviceName) {
    return {
      port,
      packageName,
      serviceName,
      package: packageName,
      getClient: () => this.getClient(port, serviceName),
      call: (method, request) => {
        return new Promise((resolve, reject) => {
          const client = this.getClient(port, serviceName);
          const grpcMethod = client[method];

          if (typeof grpcMethod !== 'function') {
            reject(new Error(`Method ${method} not found on service`));
            return;
          }

          grpcMethod.call(client, request, (error, response) => {
            if (error) {
              reject(error);
            } else {
              resolve(response);
            }
          });
        });
      }
    };
  }

  getClient(port, serviceName) {
    const key = `${port}:${serviceName}`;
    const client = this.clients.get(key);
    if (!client) {
      throw new Error(`gRPC client not found for ${serviceName} on port ${port}`);
    }
    return client;
  }

  addServiceToServer(server, packageName, serviceName, implementation) {
    const service = packageName[serviceName];
    server.addService(service.service, implementation);
    logger.info(`Added ${serviceName} service to gRPC server`);
  }

  async startServer(server) {
    return new Promise((resolve) => {
      server.start();
      logger.info('gRPC server started');
      resolve();
    });
  }

  async closeClient(port, serviceName) {
    const key = `${port}:${serviceName}`;
    const client = this.clients.get(key);
    if (client) {
      client.close();
      this.clients.delete(key);
      logger.info(`gRPC client closed for ${serviceName} on port ${port}`);
    }
  }

  async closeAllClients() {
    for (const [key, client] of this.clients) {
      try {
        client.close();
      } catch (error) {
        logger.warn(`Error closing gRPC client ${key}:`, error);
      }
    }
    this.clients.clear();
  }

  async closeServer(server) {
    return new Promise((resolve) => {
      server.tryShutdown(() => {
        logger.info('gRPC server closed');
        resolve();
      });
    });
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  wrapGrpcError(error) {
    return {
      success: false,
      message: error.message || 'An error occurred',
      code: error.code || grpc.status.INTERNAL
    };
  }
}

export const grpcHelper = new GrpcHelper();
export default grpcHelper;
