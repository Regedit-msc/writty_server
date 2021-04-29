const mongoose = require('mongoose');

const docSchema = new mongoose.Schema({
  _id: String,
  name: String,
  data: Object,
  user: {
    type: mongoose.Schema.Types.ObjectId, ref: 'user',
    required: true,
  },
  language: {
    type: String,
    default: "javascript"
  }
})

const Doc = new mongoose.model('document', docSchema)

module.exports = Doc;
