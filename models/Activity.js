const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
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
      type: String,
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
const Activity = new mongoose.model("activity", activitySchema);
module.exports = Activity;
