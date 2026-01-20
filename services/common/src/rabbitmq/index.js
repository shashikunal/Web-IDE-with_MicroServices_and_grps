import amqp from 'amqplib';
import config from '../config/index.js';
import { logger } from '../logger/index.js';

class RabbitMQClient {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.consumers = new Map();
  }

  getConnectionUrl() {
    const { host, port, username, password, vhost } = config.rabbitmq;
    return `amqp://${username}:${password}@${host}:${port}${vhost}`;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(this.getConnectionUrl());
      this.channel = await this.connection.createChannel();

      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });

      await this.channel.prefetch(10);
      this.isConnected = true;
      logger.info('RabbitMQ connected successfully');

      await this.setupExchange();
      return this.channel;
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async setupExchange() {
    const { name, type } = config.rabbitmq.exchange;
    await this.channel.assertExchange(name, type, { durable: true });
    logger.info(`RabbitMQ exchange '${name}' asserted`);
  }

  async publish(routingKey, message) {
    try {
      const { name } = config.rabbitmq.exchange;
      const messageBuffer = Buffer.from(JSON.stringify(message));

      this.channel.publish(name, routingKey, messageBuffer, {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now()
      });

      logger.debug(`Published message to routing key: ${routingKey}`);
      return true;
    } catch (error) {
      logger.error(`Failed to publish message to ${routingKey}:`, error);
      throw error;
    }
  }

  async subscribe(routingKey, handler, options = {}) {
    try {
      const { name } = config.rabbitmq.exchange;
      const queueName = options.queueName || `${config.rabbitmq.queuePrefix}${routingKey.replace(/\./g, '_')}`;

      await this.channel.assertQueue(queueName, {
        durable: true,
        arguments: {
          'x-message-ttl': options.messageTtl || 86400000,
          'x-dead-letter-exchange': `${name}.dlx`
        }
      });

      await this.channel.bindQueue(queueName, name, routingKey);

      const consumerTag = await this.channel.consume(queueName, async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            await handler(content, msg);
            this.channel.ack(msg);
          } catch (error) {
            logger.error(`Error processing message from ${routingKey}:`, error);
            this.channel.nack(msg, false, false);
          }
        }
      });

      this.consumers.set(routingKey, consumerTag.consumerTag);
      logger.info(`Subscribed to routing key: ${routingKey}`);

      return consumerTag.consumerTag;
    } catch (error) {
      logger.error(`Failed to subscribe to ${routingKey}:`, error);
      throw error;
    }
  }

  async unsubscribe(routingKey) {
    try {
      const consumerTag = this.consumers.get(routingKey);
      if (consumerTag) {
        await this.channel.cancel(consumerTag);
        this.consumers.delete(routingKey);
        logger.info(`Unsubscribed from routing key: ${routingKey}`);
      }
    } catch (error) {
      logger.error(`Failed to unsubscribe from ${routingKey}:`, error);
      throw error;
    }
  }

  async publishUserEvent(eventType, data) {
    return this.publish(`user.${eventType}`, {
      eventType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  async publishWorkspaceEvent(eventType, data) {
    return this.publish(`workspace.${eventType}`, {
      eventType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  async publishAuthEvent(eventType, data) {
    return this.publish(`auth.${eventType}`, {
      eventType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  async publishContainerEvent(eventType, data) {
    return this.publish(`container.${eventType}`, {
      eventType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  async close() {
    try {
      for (const [routingKey, consumerTag] of this.consumers) {
        await this.channel.cancel(consumerTag);
      }
      this.consumers.clear();

      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }

      this.isConnected = false;
      logger.info('RabbitMQ connection closed');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection:', error);
      throw error;
    }
  }
}

export const rabbitMQClient = new RabbitMQClient();
export default rabbitMQClient;
