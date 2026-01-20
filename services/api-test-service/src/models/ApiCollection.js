import mongoose from 'mongoose';

const apiCollectionSchema = new mongoose.Schema({
  workspaceId: String,
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  parentId: String
}, { timestamps: true });

apiCollectionSchema.index({ userId: 1 });
const ApiCollection = mongoose.model('ApiCollection', apiCollectionSchema);
export default ApiCollection;
