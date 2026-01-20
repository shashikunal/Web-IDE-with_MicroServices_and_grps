import mongoose from 'mongoose';
const apiHistorySchema = new mongoose.Schema({ userId: String, method: String, url: String, status: Number, time: Number, executedAt: Date }, { timestamps: true, collection: 'apihistories' });
const ApiHistory = mongoose.model('ApiHistory', apiHistorySchema);
export default ApiHistory;
