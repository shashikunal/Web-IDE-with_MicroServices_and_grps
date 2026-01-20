# Coding Platform - Microservices Architecture

## Overview

This is a refactored version of the Code Playground platform using a microservices architecture with:
- **gRPC** for high-performance inter-service communication
- **Redis** for caching
- **RabbitMQ** for async messaging
- **API Gateway** pattern for unified client access

## Services

| Service | Port | gRPC Port | Purpose |
|---------|------|-----------|---------|
| API Gateway | 3000 | 5000 | Single entry point for all clients |
| Auth Service | 3001 | 5001 | Authentication, JWT tokens |
| User Service | 3002 | 5002 | User profiles, roles |
| Workspace Service | 3003 | 5003 | Containers, files, templates |
| Snippet Service | 3004 | 5004 | Code snippets management |
| API Test Service | 3005 | 5005 | Postman-like API testing |
| Terminal Service | 3006 | 5006 | WebSocket terminal sessions |
| Admin Service | 3008 | 5007 | Admin panel operations |

## Quick Start

### Development

```bash
# Install all dependencies
npm run install:all

# Start all microservices in development mode
npm run services

# Start frontend
npm run client
```

### Docker

```bash
# Start all services with Docker Compose
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down
```

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │           Frontend (React)              │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────┐
                    │           API Gateway (Express)          │
                    │  - Authentication                        │
                    │  - Request routing                       │
                    │  - Redis caching                         │
                    └─────────────────┬───────────────────────┘
                                      │
        ┌─────────────┬───────────────┼───────────────┬─────────────┐
        │             │               │               │             │
┌───────▼───────┐ ┌───▼─────┐ ┌───────▼───────┐ ┌───▼─────┐ ┌───────▼───────┐
│  Auth Service │ │User Svc │ │Workspace Svc  │ │Snippet  │ │  API Test     │
│  (gRPC + JWT) │ │ (gRPC)  │ │ (gRPC + Docker)│ │ Service │ │   Service     │
└───────┬───────┘ └────┬────┘ └───────┬───────┘ └────┬────┘ └───────┬───────┘
        │              │              │              │              │
        └──────────────┴──────────────┴──────────────┴──────────────┘
                                      │
                    ┌─────────────────▼───────────────────────┐
                    │          Redis (Caching)                 │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────┐
                    │         RabbitMQ (Events)                │
                    └─────────────────────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────┐
                    │           MongoDB                        │
                    └─────────────────────────────────────────┘
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

### Workspaces
- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace
- `DELETE /api/workspaces/:id` - Delete workspace
- `GET /api/workspaces/:id/files` - List files
- `GET /api/workspaces/:id/file` - Get file content
- `POST /api/workspaces/:id/file` - Save file
- `POST /api/workspaces/:id/directory` - Create directory
- `GET /api/workspaces/:id/tree` - Get file tree

### Snippets
- `GET /api/snippets` - List snippets
- `POST /api/snippets` - Create snippet
- `GET /api/snippets/:id` - Get snippet
- `PUT /api/snippets/:id` - Update snippet
- `DELETE /api/snippets/:id` - Delete snippet

### API Testing
- `GET /api/apitest/collections` - List collections
- `POST /api/apitest/collections` - Create collection
- `DELETE /api/apitest/collections/:id` - Delete collection
- `GET /api/apitest/requests` - List requests
- `POST /api/apitest/requests` - Save request
- `GET /api/apitest/environments` - List environments
- `POST /api/apitest/environments` - Save environment
- `GET /api/apitest/history` - Get request history
- `POST /api/apitest/execute` - Execute API request

### Admin
- `GET /api/admin/users` - List users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id/roles` - Update user roles
- `PUT /api/admin/users/:id/deactivate` - Deactivate user
- `PUT /api/admin/users/:id/activate` - Activate user
- `GET /api/admin/stats` - Get system stats
- `GET /api/admin/dashboard` - Get dashboard stats

## Configuration

All services use environment variables for configuration. See `services/common/src/config/index.js` for defaults.

### Key Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_HOST` | Redis server host | localhost |
| `RABBITMQ_HOST` | RabbitMQ server host | localhost |
| `MONGODB_HOST` | MongoDB server host | localhost |
| `JWT_SECRET` | JWT signing secret | (required) |
| `SERVICE_NAME` | Service name for logging | varies |

## Caching Strategy

- **User sessions**: 24 hours
- **User profiles**: 30 minutes
- **Workspaces**: 2 hours
- **API collections/environments**: 10 minutes
- **Default cache TTL**: 1 hour

## Events (RabbitMQ)

### User Events
- `user.registered` - New user registration
- `user.login` - User login
- `user.logout` - User logout

### Workspace Events
- `workspace.created` - Workspace created
- `workspace.deleted` - Workspace deleted

### Container Events
- `container.started` - Container started
- `container.stopped` - Container stopped

### API Test Events
- `api.request.executed` - API request executed

## gRPC Services

Each service exposes gRPC endpoints for internal communication. Proto files are located in `/protos/`:

- `auth.proto` - Authentication service
- `user.proto` - User management
- `workspace.proto` - Workspace operations
- `snippet.proto` - Snippet management
- `api-test.proto` - API testing
- `terminal.proto` - Terminal sessions
- `admin.proto` - Admin operations
- `events.proto` - Event publishing

## Development Notes

1. All services use Express.js for HTTP API
2. gRPC servers run alongside HTTP servers
3. Redis is used for session caching
4. RabbitMQ is used for async event publishing
5. MongoDB stores all persistent data
6. Each service has its own package.json and dependencies
7. Common utilities are in `services/common/`

## License

MIT
