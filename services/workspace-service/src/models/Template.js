import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  templateId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  language: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  cmd: [{
    type: String
  }],
  entrypoint: {
    type: String,
    default: '/bin/sh'
  },
  port: {
    type: Number,
    default: 3000
  },
  files: {
    type: Map,
    of: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

templateSchema.index({ templateId: 1 });
templateSchema.index({ language: 1 });

const Template = mongoose.model('Template', templateSchema);

export default Template;
