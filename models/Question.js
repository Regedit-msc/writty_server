const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    tags: [String],
    question: String,
    imageUrls: [],
    answers: [],
  },
  { timestamps: true }
);
const Question = new mongoose.model("question", questionSchema);
module.exports = Question;
