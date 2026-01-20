import express from 'express';
import mongoose from 'mongoose';
import grpc from '@grpc/grpc-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  config, redisClient, rabbitMQClient, grpcHelper, logger, asyncHandler, ValidationError, AuthenticationError, errorHandler
} from '../../common/src/index.js';
import authProto from './proto/auth.js';
import User from './models/User.js';

const app = express();
const PORT = config.services.auth.port;
const GRPC_PORT = config.grpc.ports.auth;

app.use(express.json());


const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.accessTokenExpiry }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshTokenExpiry }
  );

  return { accessToken, refreshToken };
};

const validatePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

app.post('/auth/register', asyncHandler(async (req, res) => {
  const { username, email, password, role = 'student' } = req.body;

  if (!username || !email || !password) {
    throw new ValidationError('Username, email, and password are required');
  }

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new ValidationError('User with this email or username already exists');
  }

  const hashedPassword = await hashPassword(password);
  const user = new User({
    username,
    email,
    password: hashedPassword,
    role: ['student', 'publisher', 'admin'].includes(role) ? role : 'student'
  });

  await user.save();

  const tokens = generateTokens(user);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    }
  });
}));

app.post('/auth/login', asyncHandler(async (req, res) => {
  console.log('Login Request Body:', JSON.stringify(req.body));
  const { identifier, email, password } = req.body;

  if ((!identifier && !email) || !password) {
    throw new ValidationError('Email/Username and password are required');
  }

  const query = identifier
    ? { $or: [{ email: identifier }, { username: identifier }] }
    : { email };

  const user = await User.findOne(query);
  if (!user) {
    throw new AuthenticationError('Invalid credentials');
  }

  if (!user.isActive) {
    throw new AuthenticationError('Account is deactivated');
  }

  const isValid = await validatePassword(password, user.password);
  if (!isValid) {
    throw new AuthenticationError('Invalid credentials');
  }

  user.lastLogin = new Date();
  await user.save();

  const tokens = generateTokens(user);

  res.json({
    success: true,
    message: 'Login successful',
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    }
  });
}));

app.post('/auth/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  try {
    const decoded = jwt.verify(refreshToken, config.jwt.secret);

    if (decoded.type !== 'refresh') {
      throw new AuthenticationError('Invalid token type');
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    const tokens = generateTokens(user);

    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Refresh token expired');
    }
    throw error;
  }
}));

app.post('/auth/verify', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ValidationError('Token is required');
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.json({ success: false, valid: false, message: 'User not found or inactive' });
    }

    res.json({
      success: true,
      valid: true,
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email
    });
  } catch (error) {
    res.json({ success: false, valid: false, message: 'Invalid token' });
  }
}));

const authServiceImpl = {
  Register: async (call, callback) => {
    try {
      const { username, email, password, role } = call.request;

      if (!username || !email || !password) {
        return callback(null, { success: false, message: 'Missing required fields' });
      }

      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return callback(null, { success: false, message: 'User already exists' });
      }

      const hashedPassword = await hashPassword(password);
      const user = new User({
        username,
        email,
        password: hashedPassword,
        role: role || 'student'
      });

      await user.save();
      const tokens = generateTokens(user);

      await rabbitMQClient.publishAuthEvent('user.registered', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      callback(null, {
        success: true,
        message: 'User registered successfully',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString()
        }
      });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },

  Login: async (call, callback) => {
    try {
      const { email, password } = call.request;

      const user = await User.findOne({ email });
      if (!user) {
        return callback(null, { success: false, message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return callback(null, { success: false, message: 'Account is deactivated' });
      }

      const isValid = await validatePassword(password, user.password);
      if (!isValid) {
        return callback(null, { success: false, message: 'Invalid credentials' });
      }

      user.lastLogin = new Date();
      await user.save();

      const tokens = generateTokens(user);

      await redisClient.set(
        `session:${tokens.accessToken}`,
        { userId: user.id, role: user.role, email: user.email },
        config.redis.ttl.session
      );

      await rabbitMQClient.publishAuthEvent('user.login', {
        userId: user.id,
        email: user.email
      });

      callback(null, {
        success: true,
        message: 'Login successful',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString()
        }
      });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },

  VerifyToken: async (call, callback) => {
    try {
      const { token } = call.request;

      const cachedUser = await redisClient.get(`session:${token}`);
      if (cachedUser) {
        return callback(null, {
          valid: true,
          userId: cachedUser.userId,
          role: cachedUser.role,
          email: cachedUser.email
        });
      }

      const decoded = jwt.verify(token, config.jwt.secret);
      callback(null, {
        valid: true,
        userId: decoded.userId,
        role: decoded.role,
        email: decoded.email
      });
    } catch (error) {
      callback(null, { valid: false });
    }
  },

  RefreshToken: async (call, callback) => {
    try {
      const { refreshToken } = call.request;
      const decoded = jwt.verify(refreshToken, config.jwt.secret);

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return callback(null, { success: false, message: 'User not found or inactive' });
      }

      const tokens = generateTokens(user);
      callback(null, {
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (error) {
      callback(null, { success: false, message: 'Invalid refresh token' });
    }
  },

  Logout: async (call, callback) => {
    try {
      const { token } = call.request;
      if (token) {
        await redisClient.delete(`session:${token}`);
      }
      callback(null, { success: true, message: 'Logged out successfully' });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },

  ChangePassword: async (call, callback) => {
    try {
      const { userId, currentPassword, newPassword } = call.request;

      const user = await User.findById(userId);
      if (!user) {
        return callback(null, { success: false, message: 'User not found' });
      }

      const isValid = await validatePassword(currentPassword, user.password);
      if (!isValid) {
        return callback(null, { success: false, message: 'Current password is incorrect' });
      }

      user.password = await hashPassword(newPassword);
      await user.save();

      callback(null, { success: true, message: 'Password changed successfully' });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },

  ValidateSession: async (call, callback) => {
    try {
      const { sessionId, userId } = call.request;

      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        return callback(null, { valid: false });
      }

      callback(null, {
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      });
    } catch (error) {
      callback(null, { valid: false });
    }
  }
};

app.use(errorHandler);

async function startServer() {
  try {
    const mongoUrl = `mongodb://${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.database}`;
    await mongoose.connect(mongoUrl, {
      user: config.mongodb.username,
      pass: config.mongodb.password
    });
    logger.info('Connected to MongoDB');

    await redisClient.connect();
    await rabbitMQClient.connect();

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Auth HTTP server running on port ${PORT}`);
    });

    const grpcServer = await grpcHelper.createServer(GRPC_PORT);
    grpcHelper.addServiceToServer(grpcServer, authProto, 'AuthService', authServiceImpl);
    await grpcHelper.startServer(grpcServer);
    logger.info(`Auth gRPC server running on port ${GRPC_PORT}`);
  } catch (error) {
    logger.error('Failed to start Auth Service:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down');
  await mongoose.connection.close();
  await redisClient.close();
  await rabbitMQClient.close();
  process.exit(0);
});

export default app;
