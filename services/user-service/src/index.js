import express from 'express';
import mongoose from 'mongoose';
import grpc from '@grpc/grpc-js';
import {
  config, redisClient, rabbitMQClient, grpcHelper, logger, asyncHandler, AuthorizationError
} from '../../common/src/index.js';
import userProto from './proto/user.js';
import User from './models/User.js';
import Profile from './models/Profile.js';

const app = express();
const PORT = config.services.user.port;
const GRPC_PORT = config.grpc.ports.user;

app.use(express.json());

app.post('/user/profile', asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const profile = await Profile.findOne({ userId }) || { userId };
  res.json({ success: true, profile });
}));

app.put('/user/profile', asyncHandler(async (req, res) => {
  const { userId, firstName, lastName, bio, avatar, preferences } = req.body;

  let profile = await Profile.findOne({ userId });
  if (!profile) {
    profile = new Profile({ userId });
  }

  if (firstName !== undefined) profile.firstName = firstName;
  if (lastName !== undefined) profile.lastName = lastName;
  if (bio !== undefined) profile.bio = bio;
  if (avatar !== undefined) profile.avatar = avatar;
  if (preferences !== undefined) profile.preferences = { ...profile.preferences, ...preferences };

  await profile.save();

  await redisClient.delete(`user:${userId}:profile`);

  res.json({ success: true, profile });
}));

app.post('/user/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({ success: true, user });
}));

const userServiceImpl = {
  GetProfile: async (call, callback) => {
    try {
      const { userId } = call.request;

      const profile = await Profile.findOne({ userId });
      callback(null, {
        success: true,
        profile: profile ? {
          userId: profile.userId,
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          bio: profile.bio || '',
          avatar: profile.avatar || '',
          preferences: profile.preferences || { theme: 'dark', language: 'en' },
          updatedAt: profile.updatedAt?.toISOString() || ''
        } : {
          userId,
          firstName: '',
          lastName: '',
          bio: '',
          avatar: '',
          preferences: { theme: 'dark', language: 'en' },
          updatedAt: ''
        }
      });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },

  UpdateProfile: async (call, callback) => {
    try {
      const { userId, firstName, lastName, bio, avatar, preferences } = call.request;

      let profile = await Profile.findOne({ userId });
      if (!profile) {
        profile = new Profile({ userId });
      }

      if (firstName !== undefined) profile.firstName = firstName;
      if (lastName !== undefined) profile.lastName = lastName;
      if (bio !== undefined) profile.bio = bio;
      if (avatar !== undefined) profile.avatar = avatar;
      if (preferences) profile.preferences = { ...profile.preferences, ...preferences };

      await profile.save();

      await redisClient.delete(`user:${userId}:profile`);

      callback(null, {
        success: true,
        message: 'Profile updated successfully',
        profile: {
          userId: profile.userId,
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          bio: profile.bio || '',
          avatar: profile.avatar || '',
          preferences: profile.preferences || { theme: 'dark', language: 'en' },
          updatedAt: profile.updatedAt?.toISOString() || ''
        }
      });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },

  GetUserById: async (call, callback) => {
    try {
      const { userId: targetUserId } = call.request;

      const user = await User.findById(targetUserId).select('-password');
      if (!user) {
        return callback(null, { success: false, message: 'User not found' });
      }

      callback(null, {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin?.toISOString() || '',
          createdAt: user.createdAt?.toISOString() || ''
        }
      });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },

  GetAllUsers: async (call, callback) => {
    try {
      const { page = 1, limit = 20, search, role, isActive } = call.request;

      const query = {};
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      if (role) query.role = role;
      if (isActive !== undefined) query.isActive = isActive;

      const skip = (page - 1) * limit;
      const users = await User.find(query)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(query);

      callback(null, {
        success: true,
        users: users.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          lastLogin: u.lastLogin?.toISOString() || '',
          createdAt: u.createdAt?.toISOString() || ''
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },

  DeactivateUser: async (call, callback) => {
    try {
      const { userId, adminId } = call.request;

      const admin = await User.findById(adminId);
      if (!admin || admin.role !== 'admin') {
        return callback(null, { success: false, message: 'Admin access required' });
      }

      await User.findByIdAndUpdate(userId, { isActive: false });

      await redisClient.invalidateCache('user', userId);

      callback(null, { success: true, message: 'User deactivated' });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },

  ActivateUser: async (call, callback) => {
    try {
      const { userId, adminId } = call.request;

      const admin = await User.findById(adminId);
      if (!admin || admin.role !== 'admin') {
        return callback(null, { success: false, message: 'Admin access required' });
      }

      await User.findByIdAndUpdate(userId, { isActive: true });

      await redisClient.invalidateCache('user', userId);

      callback(null, { success: true, message: 'User activated' });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },

  UpdateRoles: async (call, callback) => {
    try {
      const { userId, roles, adminId } = call.request;

      const admin = await User.findById(adminId);
      if (!admin || admin.role !== 'admin') {
        return callback(null, { success: false, message: 'Admin access required' });
      }

      await User.findByIdAndUpdate(userId, { role: roles[0] });

      await redisClient.invalidateCache('user', userId);

      callback(null, { success: true, message: 'Roles updated' });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },

  GetUserStats: async (call, callback) => {
    try {
      const [totalUsers, activeUsers, admins, publishers, students] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ role: 'publisher' }),
        User.countDocuments({ role: 'student' })
      ]);

      callback(null, {
        success: true,
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        admins,
        publishers,
        students
      });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  }
};

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
      logger.info(`User HTTP server running on port ${PORT}`);
    });

    const grpcServer = await grpcHelper.createServer(GRPC_PORT);
    grpcHelper.addServiceToServer(grpcServer, userProto, 'UserService', userServiceImpl);
    await grpcHelper.startServer(grpcServer);
    logger.info(`User gRPC server running on port ${GRPC_PORT}`);
  } catch (error) {
    logger.error('Failed to start User Service:', error);
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
