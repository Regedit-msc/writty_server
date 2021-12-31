const mongoose = require("mongoose");

const snippetSchema = new mongoose.Schema(
  {
    code: String,
    name: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    language: String,
  },
  { timestamps: true }
);
const Snippet = new mongoose.model("snippet", snippetSchema);
module.exports = Snippet;
