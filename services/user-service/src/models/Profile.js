import mongoose from 'mongoose';

const preferencesSchema = new mongoose.Schema({
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'dark'
  },
  language: {
    type: String,
    default: 'en'
  }
}, { _id: false });

const profileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  preferences: {
    type: preferencesSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

profileSchema.index({ userId: 1 });

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
