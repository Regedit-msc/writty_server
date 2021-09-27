const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    title: String,
    data: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    answers: [],
  },
  { timestamps: true }
);
const Question = new mongoose.model("question", questionSchema);
module.exports = Question;
