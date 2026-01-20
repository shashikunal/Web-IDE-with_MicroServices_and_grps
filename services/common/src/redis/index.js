import Redis from 'ioredis';
import config from '../config/index.js';
import { logger } from '../logger/index.js';

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const options = {
        host: config.redis.host,
        port: config.redis.port,
        db: config.redis.db,
        keyPrefix: config.redis.keyPrefix,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      };

      if (config.redis.password) {
        options.password = config.redis.password;
      }

      this.client = new Redis(options);

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully');
      });

      this.client.on('error', (err) => {
        logger.error('Redis connection error:', err);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error);
      throw error;
    }
  }

  async set(key, value, ttl = config.redis.ttl.default) {
    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
      logger.debug(`Redis set key ${key} with TTL ${ttl}`);
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error);
      throw error;
    }
  }

  async delete(key) {
    try {
      await this.client.del(key);
      logger.debug(`Redis deleted key ${key}`);
    } catch (error) {
      logger.error(`Redis delete error for key ${key}:`, error);
      throw error;
    }
  }

  async deletePattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.debug(`Redis deleted ${keys.length} keys matching pattern ${pattern}`);
      }
    } catch (error) {
      logger.error(`Redis delete pattern error for ${pattern}:`, error);
      throw error;
    }
  }

  async getOrSet(key, fetchFn, ttl = config.redis.ttl.default) {
    try {
      const cached = await this.get(key);
      if (cached) {
        logger.debug(`Cache hit for key ${key}`);
        return cached;
      }

      logger.debug(`Cache miss for key ${key}, fetching fresh data`);
      const fresh = await fetchFn();
      await this.set(key, fresh, ttl);
      return fresh;
    } catch (error) {
      logger.error(`Redis getOrSet error for key ${key}:`, error);
      return await fetchFn();
    }
  }

  async invalidateCache(service, id = null, type = null) {
    try {
      const patterns = [];
      if (id) {
        patterns.push(`${config.redis.keyPrefix}${service}:${id}:*`);
      }
      if (type) {
        patterns.push(`${config.redis.keyPrefix}${service}:*:${type}`);
      }
      patterns.push(`${config.redis.keyPrefix}${service}:*`);

      for (const pattern of patterns) {
        await this.deletePattern(pattern);
      }
    } catch (error) {
      logger.error(`Redis invalidate cache error for ${service}:`, error);
      throw error;
    }
  }

  async close() {
    try {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
      throw error;
    }
  }
}

export const redisClient = new RedisClient();
export default redisClient;
