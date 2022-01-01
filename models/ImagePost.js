const mongoose = require("mongoose");

const imagePostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    tags: [String],
    imageUrl: String,
  },
  { timestamps: true }
);
const ImagePost = new mongoose.model("image_post", imagePostSchema);
module.exports = ImagePost;
