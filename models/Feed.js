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
    imagePostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "image_post",
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "question",
    },
    followedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    whoFollowedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    whoLikedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    docId: {
      type: String,
      ref: "document",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    likes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
      default: [],
    },
    comments: {
      type: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
          body: String,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);
const Feed = new mongoose.model("feed", feedSchema);

module.exports = Feed;
