import mongoose from 'mongoose';

const apiEnvironmentSchema = new mongoose.Schema({
  workspaceId: String,
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  variables: [new mongoose.Schema({ key: String, value: String, enabled: Boolean })]
}, { timestamps: true });

const ApiEnvironment = mongoose.model('ApiEnvironment', apiEnvironmentSchema);
export default ApiEnvironment;
