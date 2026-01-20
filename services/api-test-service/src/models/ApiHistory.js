import mongoose from 'mongoose';

const apiHistorySchema = new mongoose.Schema({
  workspaceId: String,
  userId: { type: String, required: true, index: true },
  method: { type: String, default: 'GET' },
  url: String,
  status: Number,
  time: Number,
  executedAt: { type: Date, default: Date.now }
});

apiHistorySchema.index({ userId: 1, executedAt: -1 });
const ApiHistory = mongoose.model('ApiHistory', apiHistorySchema);
export default ApiHistory;
