import mongoose from 'mongoose';

const apiRequestSchema = new mongoose.Schema({
  workspaceId: String,
  collectionId: String,
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  method: { type: String, default: 'GET' },
  url: String,
  headers: [new mongoose.Schema({ key: String, value: String, enabled: Boolean })],
  bodyType: String,
  body: mongoose.Schema.Types.Mixed,
  formData: [new mongoose.Schema({ key: String, value: String, type: String, enabled: Boolean })],
  auth: new mongoose.Schema({ type: String, token: String, username: String, password: String }),
  testScript: String
}, { timestamps: true });

apiRequestSchema.index({ userId: 1, collectionId: 1 });
const ApiRequest = mongoose.model('ApiRequest', apiRequestSchema);
export default ApiRequest;
