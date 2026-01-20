import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'publisher', 'admin'], default: 'student' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date
}, { timestamps: true, collection: 'users' });

const User = mongoose.model('User', userSchema);
export default User;
