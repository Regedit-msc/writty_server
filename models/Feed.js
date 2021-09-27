const mongoose = require("mongoose");

const feedSchema = new mongoose.Schema(
  {
    type: String,
    snippetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "snippet",
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "question",
    },
    followedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    docId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "document",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);
const Feed = new mongoose.model("feed", feedSchema);

module.exports = Feed;
