import mongoose from 'mongoose';

const snippetSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  code: { type: String, required: true },
  language: { type: String, required: true }
}, { timestamps: true });

snippetSchema.index({ userId: 1, createdAt: -1 });
snippetSchema.index({ language: 1 });

const Snippet = mongoose.model('Snippet', snippetSchema);
export default Snippet;
