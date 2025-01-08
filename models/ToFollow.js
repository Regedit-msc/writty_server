const mongoose = require("mongoose");

const toFollowSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    userToFollow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    reference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);
const ToFollow = new mongoose.model("tofollow", toFollowSchema);
module.exports = ToFollow;
