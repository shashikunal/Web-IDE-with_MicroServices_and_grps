import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    required: true
  },
  workspaceId: {
    type: String,
    required: true,
    unique: true
  },
  templateId: {
    type: String,
    required: true
  },
  templateName: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  containerId: {
    type: String
  },
  publicPort: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['creating', 'running', 'stopped', 'error'],
    default: 'creating'
  },
  workspacePath: {
    type: String
  }
}, {
  timestamps: true
});

workspaceSchema.index({ userId: 1, createdAt: -1 });
workspaceSchema.index({ workspaceId: 1 });

const Workspace = mongoose.model('Workspace', workspaceSchema);

export default Workspace;
