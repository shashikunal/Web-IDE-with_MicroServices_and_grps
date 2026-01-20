import mongoose from 'mongoose';
const snippetSchema = new mongoose.Schema({ userId: String, title: String, language: String }, { timestamps: true, collection: 'snippets' });
const Snippet = mongoose.model('Snippet', snippetSchema);
export default Snippet;
