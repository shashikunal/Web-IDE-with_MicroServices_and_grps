import express from 'express';
import mongoose from 'mongoose';
import grpc from '@grpc/grpc-js';
import { config, redisClient, grpcHelper, logger, asyncHandler } from '../../common/src/index.js';
import snippetProto from './proto/snippet.js';
import Snippet from './models/Snippet.js';

const app = express();
const PORT = config.services.snippet.port;
const GRPC_PORT = config.grpc.ports.snippet;

app.use(express.json());

app.post('/snippet', asyncHandler(async (req, res) => {
  const { userId, page = 1, limit = 100, language } = req.body;
  const query = { userId };
  if (language) query.language = language;
  const skip = (page - 1) * limit;
  const snippets = await Snippet.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
  const total = await Snippet.countDocuments(query);
  res.json({ success: true, snippets, total });
}));

app.post('/snippet/:id', asyncHandler(async (req, res) => {
  const snippet = await Snippet.findOne({ _id: req.params.id, userId: req.body.userId });
  if (!snippet) return res.status(404).json({ success: false, message: 'Snippet not found' });
  res.json({ success: true, snippet });
}));

app.put('/snippet', asyncHandler(async (req, res) => {
  const { userId, title, code, language } = req.body;
  const snippet = new Snippet({ userId, title, code, language });
  await snippet.save();
  res.status(201).json({ success: true, snippet });
}));

app.post('/snippet/:id', asyncHandler(async (req, res) => {
  const { userId, title, code, language } = req.body;
  const snippet = await Snippet.findOneAndUpdate(
    { _id: req.params.id, userId },
    { title, code, language, updatedAt: new Date() },
    { new: true }
  );
  if (!snippet) return res.status(404).json({ success: false, message: 'Snippet not found' });
  res.json({ success: true, snippet });
}));

app.delete('/snippet/:id', asyncHandler(async (req, res) => {
  const result = await Snippet.findOneAndDelete({ _id: req.params.id, userId: req.body.userId });
  if (!result) return res.status(404).json({ success: false, message: 'Snippet not found' });
  res.json({ success: true, message: 'Snippet deleted' });
}));

const snippetServiceImpl = {
  GetSnippets: async (call, callback) => {
    try {
      const { userId, page = 1, limit = 100, language } = call.request;
      const query = { userId };
      if (language) query.language = language;
      const skip = (page - 1) * limit;
      const snippets = await Snippet.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
      const total = await Snippet.countDocuments(query);
      callback(null, { success: true, snippets: snippets.map(s => s.toObject()), total });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },
  GetSnippet: async (call, callback) => {
    try {
      const { userId, snippetId } = call.request;
      const snippet = await Snippet.findOne({ _id: snippetId, userId });
      if (!snippet) return callback(null, { success: false, message: 'Snippet not found' });
      callback(null, { success: true, snippet: snippet.toObject() });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },
  CreateSnippet: async (call, callback) => {
    try {
      const { userId, title, code, language } = call.request;
      const snippet = new Snippet({ userId, title, code, language });
      await snippet.save();
      callback(null, { success: true, message: 'Snippet created', snippet: snippet.toObject() });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },
  UpdateSnippet: async (call, callback) => {
    try {
      const { userId, snippetId, title, code, language } = call.request;
      const snippet = await Snippet.findOneAndUpdate(
        { _id: snippetId, userId },
        { title, code, language, updatedAt: new Date() },
        { new: true }
      );
      if (!snippet) return callback(null, { success: false, message: 'Snippet not found' });
      callback(null, { success: true, snippet: snippet.toObject() });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },
  DeleteSnippet: async (call, callback) => {
    try {
      const { userId, snippetId } = call.request;
      const result = await Snippet.findOneAndDelete({ _id: snippetId, userId });
      if (!result) return callback(null, { success: false, message: 'Snippet not found' });
      callback(null, { success: true, message: 'Snippet deleted' });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  }
};

async function startServer() {
  try {
    const mongoUrl = `mongodb://${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.database}`; await mongoose.connect(mongoUrl, { user: config.mongodb.username, pass: config.mongodb.password });
    logger.info('Connected to MongoDB');
    await redisClient.connect();
    app.listen(PORT, '0.0.0.0', () => logger.info(`Snippet HTTP running on ${PORT}`));
    const grpcServer = await grpcHelper.createServer(GRPC_PORT);
    grpcHelper.addServiceToServer(grpcServer, snippetProto, 'SnippetService', snippetServiceImpl);
    await grpcHelper.startServer(grpcServer);
    logger.info(`Snippet gRPC running on ${GRPC_PORT}`);
  } catch (error) {
    logger.error('Failed to start Snippet Service:', error);
    process.exit(1);
  }
}

startServer();
process.on('SIGTERM', async () => { await mongoose.connection.close(); await redisClient.close(); process.exit(0); });
export default app;
