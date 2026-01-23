import express from 'express';
import mongoose from 'mongoose';
import grpc from '@grpc/grpc-js';
import axios from 'axios';
import { config, redisClient, rabbitMQClient, grpcHelper, logger, asyncHandler } from '../../common/src/index.js';
import apiTestProto from './proto/api-test.js';
import ApiCollection from './models/ApiCollection.js';
import ApiRequest from './models/ApiRequest.js';
import ApiEnvironment from './models/ApiEnvironment.js';
import ApiHistory from './models/ApiHistory.js';

const app = express();
const PORT = config.services.apitest.port;
const GRPC_PORT = config.grpc.ports.apitest;

app.use(express.json());

app.post('/collections', asyncHandler(async (req, res) => {
  const { userId, workspaceId, name, parentId } = req.body;
  const collection = new ApiCollection({ workspaceId, userId, name, parentId });
  await collection.save();
  res.status(201).json({ success: true, collection });
}));

app.post('/collections/list', asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const collections = await ApiCollection.find({ userId });
  res.json({ success: true, collections });
}));

app.delete('/collections/:id', asyncHandler(async (req, res) => {
  await ApiCollection.findOneAndDelete({ _id: req.params.id, userId: req.body.userId });
  await ApiRequest.deleteMany({ collectionId: req.params.id });
  res.json({ success: true, message: 'Collection deleted' });
}));

// Update collection
app.put('/collections/:id', asyncHandler(async (req, res) => {
  const { userId, name, parentId } = req.body;
  const collection = await ApiCollection.findOneAndUpdate(
    { _id: req.params.id, userId },
    { name, parentId },
    { new: true }
  );
  if (!collection) {
    return res.status(404).json({ success: false, message: 'Collection not found' });
  }
  res.json({ success: true, collection });
}));

app.post('/requests', asyncHandler(async (req, res) => {
  const { userId, request } = req.body;
  const reqDoc = new ApiRequest({ ...request, userId });
  await reqDoc.save();
  res.status(201).json({ success: true, request: reqDoc });
}));

app.post('/requests/list', asyncHandler(async (req, res) => {
  const { userId, collectionId } = req.body;
  const query = { userId };
  if (collectionId) query.collectionId = collectionId;
  const requests = await ApiRequest.find(query);
  res.json({ success: true, requests });
}));

app.delete('/requests/:id', asyncHandler(async (req, res) => {
  await ApiRequest.findOneAndDelete({ _id: req.params.id, userId: req.body.userId });
  res.json({ success: true, message: 'Request deleted' });
}));

// Update request
app.put('/requests/:id', asyncHandler(async (req, res) => {
  const { userId, ...updateData } = req.body;
  const request = await ApiRequest.findOneAndUpdate(
    { _id: req.params.id, userId },
    updateData,
    { new: true }
  );
  if (!request) {
    return res.status(404).json({ success: false, message: 'Request not found' });
  }
  res.json({ success: true, request });
}));

app.post('/environments', asyncHandler(async (req, res) => {
  const { userId, environment } = req.body;
  const envDoc = new ApiEnvironment({ ...environment, userId });
  await envDoc.save();
  res.status(201).json({ success: true, environment: envDoc });
}));

app.post('/environments/list', asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const environments = await ApiEnvironment.find({ userId });
  res.json({ success: true, environments });
}));

app.delete('/environments/:id', asyncHandler(async (req, res) => {
  await ApiEnvironment.findOneAndDelete({ _id: req.params.id, userId: req.body.userId });
  res.json({ success: true, message: 'Environment deleted' });
}));

// Update environment
app.put('/environments/:id', asyncHandler(async (req, res) => {
  const { userId, ...updateData } = req.body;
  const environment = await ApiEnvironment.findOneAndUpdate(
    { _id: req.params.id, userId },
    updateData,
    { new: true }
  );
  if (!environment) {
    return res.status(404).json({ success: false, message: 'Environment not found' });
  }
  res.json({ success: true, environment });
}));

app.post('/history', asyncHandler(async (req, res) => {
  const { userId, history } = req.body;
  const historyDoc = new ApiHistory({ ...history, userId });
  await historyDoc.save();
  res.status(201).json({ success: true, history: historyDoc });
}));

app.post('/history/list', asyncHandler(async (req, res) => {
  const { userId, limit = 100 } = req.body;
  const history = await ApiHistory.find({ userId }).sort({ executedAt: -1 }).limit(limit);
  res.json({ success: true, history });
}));

app.post('/execute', asyncHandler(async (req, res) => {
  const { userId, request, environmentId } = req.body;
  const startTime = Date.now();

  try {
    const headers = {};
    if (request.headers) {
      request.headers.forEach(h => { if (h.enabled !== false) headers[h.key] = h.value; });
    }

    let body = request.body;
    if (request.bodyType === 'json' && typeof request.body === 'string') {
      try { body = JSON.parse(request.body); } catch { }
    }

    const config = {
      method: request.method,
      url: request.url,
      headers,
      data: body,
      timeout: 30000,
      validateStatus: () => true
    };

    const response = await axios(config);
    const duration = Date.now() - startTime;

    const historyEntry = new ApiHistory({
      workspaceId: request.workspaceId,
      userId,
      method: request.method,
      url: request.url,
      status: response.status,
      time: duration,
      executedAt: new Date()
    });
    await historyEntry.save();

    await rabbitMQClient.publish('api.request.executed', {
      userId,
      method: request.method,
      url: request.url,
      status: response.status,
      duration
    });

    res.json({
      success: true,
      status: response.status,
      time: duration,
      responseHeaders: Object.entries(response.headers).map(([key, value]) => ({ key, value: String(value) })),
      body: typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    });
  } catch (error) {
    res.json({ success: false, message: error.message, error: error.message });
  }
}));

const apiTestServiceImpl = {
  GetCollections: async (call, callback) => {
    try {
      const { userId } = call.request;
      const collections = await ApiCollection.find({ userId });
      callback(null, { success: true, collections });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  },
  CreateCollection: async (call, callback) => {
    try {
      const { userId, workspaceId, name, parentId } = call.request;
      const collection = new ApiCollection({ workspaceId, userId, name, parentId });
      await collection.save();
      callback(null, { success: true, collection: collection.toObject() });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  },
  DeleteCollection: async (call, callback) => {
    try {
      const { userId, collectionId } = call.request;
      await ApiCollection.findOneAndDelete({ _id: collectionId, userId });
      await ApiRequest.deleteMany({ collectionId });
      callback(null, { success: true, message: 'Collection deleted' });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  },
  GetRequests: async (call, callback) => {
    try {
      const { userId, collectionId } = call.request;
      const query = { userId };
      if (collectionId) query.collectionId = collectionId;
      const requests = await ApiRequest.find(query);
      callback(null, { success: true, requests: requests.map(r => r.toObject()) });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  },
  SaveRequest: async (call, callback) => {
    try {
      const { userId, request } = call.request;
      const reqDoc = new ApiRequest({ ...request, userId });
      await reqDoc.save();
      callback(null, { success: true, request: reqDoc.toObject() });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  },
  DeleteRequest: async (call, callback) => {
    try {
      const { userId, requestId } = call.request;
      await ApiRequest.findOneAndDelete({ _id: requestId, userId });
      callback(null, { success: true, message: 'Request deleted' });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  },
  GetEnvironments: async (call, callback) => {
    try {
      const { userId } = call.request;
      const environments = await ApiEnvironment.find({ userId });
      callback(null, { success: true, environments: environments.map(e => e.toObject()) });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  },
  SaveEnvironment: async (call, callback) => {
    try {
      const { userId, environment } = call.request;
      const envDoc = new ApiEnvironment({ ...environment, userId });
      await envDoc.save();
      callback(null, { success: true, environment: envDoc.toObject() });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  },
  DeleteEnvironment: async (call, callback) => {
    try {
      const { userId, environmentId } = call.request;
      await ApiEnvironment.findOneAndDelete({ _id: environmentId, userId });
      callback(null, { success: true, message: 'Environment deleted' });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  },
  GetHistory: async (call, callback) => {
    try {
      const { userId, limit = 100 } = call.request;
      const history = await ApiHistory.find({ userId }).sort({ executedAt: -1 }).limit(limit);
      callback(null, { success: true, history: history.map(h => h.toObject()) });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  },
  AddToHistory: async (call, callback) => {
    try {
      const { userId, history } = call.request;
      const historyDoc = new ApiHistory({ ...history, userId });
      await historyDoc.save();
      callback(null, { success: true, history: historyDoc.toObject() });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  },
  ExecuteRequest: async (call, callback) => {
    try {
      const { userId, request } = call.request;
      const startTime = Date.now();

      const headers = {};
      if (request.headers) {
        request.headers.forEach(h => { if (h.enabled !== false) headers[h.key] = h.value; });
      }

      const response = await axios({
        method: request.method,
        url: request.url,
        headers,
        data: request.body,
        timeout: 30000,
        validateStatus: () => true
      });

      const duration = Date.now() - startTime;

      const historyDoc = new ApiHistory({
        workspaceId: request.workspaceId,
        userId,
        method: request.method,
        url: request.url,
        status: response.status,
        time: duration,
        executedAt: new Date()
      });
      await historyDoc.save();

      callback(null, {
        success: true,
        status: response.status,
        time: duration,
        responseHeaders: Object.entries(response.headers).map(([k, v]) => ({ key: k, value: String(v) })),
        body: typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
      });
    } catch (error) {
      callback(null, { success: false, message: error.message, error: error.message });
    }
  }
};

async function startServer() {
  try {
    const mongoUrl = `mongodb://${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.database}`; await mongoose.connect(mongoUrl, { user: config.mongodb.username, pass: config.mongodb.password });
    logger.info('Connected to MongoDB');
    await redisClient.connect();
    await rabbitMQClient.connect();
    app.listen(PORT, '0.0.0.0', () => logger.info(`API Test HTTP running on ${PORT}`));
    const grpcServer = await grpcHelper.createServer(GRPC_PORT);
    grpcHelper.addServiceToServer(grpcServer, apiTestProto, 'ApiTestService', apiTestServiceImpl);
    await grpcHelper.startServer(grpcServer);
    logger.info(`API Test gRPC running on ${GRPC_PORT}`);
  } catch (error) {
    logger.error('Failed to start API Test Service:', error);
    process.exit(1);
  }
}

startServer();
process.on('SIGTERM', async () => { await mongoose.connection.close(); await redisClient.close(); await rabbitMQClient.close(); process.exit(0); });
export default app;
