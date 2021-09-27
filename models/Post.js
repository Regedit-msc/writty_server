const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    name: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    color: String,
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    badges: [badgeSchema],
    body: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    image: String,
  },
  { timestamps: true }
);
const Post = new mongoose.model("post", postSchema);

module.exports = Post;
