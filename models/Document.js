const mongoose = require('mongoose');
const commentSchema = require('./Comment');
const LikeUserSchema = require('./LikeUser');

const docSchema = new mongoose.Schema({
  _id: String,
  name: String,
  data: String,
  user: {
    type: mongoose.Schema.Types.ObjectId, ref: 'user',
    required: true,
  },
  language: {
    type: String,
    default: "javascript"
  },
  private: {
    type: Boolean,
    default: true,
  },
  publicLink: String,
  collabLink: String,
  theme: String,
  likes: {
    type: [LikeUserSchema],
    default: [],
  },

  comments: {
    type: [commentSchema],
    default: []
  }
}, { timestamps: true })
docSchema.index({ name: 1, type: -1 });
const Doc = new mongoose.model('document', docSchema);

module.exports = Doc;
