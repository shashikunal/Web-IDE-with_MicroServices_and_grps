import mongoose from 'mongoose';
const workspaceSchema = new mongoose.Schema({ userId: String, workspaceId: String, templateId: String, status: String }, { timestamps: true, collection: 'workspaces' });
const Workspace = mongoose.model('Workspace', workspaceSchema);
export default Workspace;
