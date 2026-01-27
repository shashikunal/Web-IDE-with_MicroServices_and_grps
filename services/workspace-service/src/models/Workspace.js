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
  title: {
    type: String,
    default: 'Untitled Workspace'
  },
  description: {
    type: String,
    default: ''
  },
  cpu: {
    type: Number,
    default: 2.0
  },
  memory: {
    type: String,
    default: '2g'
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
