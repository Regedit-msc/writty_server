const mongoose = require("mongoose");

const commentSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'user',
        required: true,
    },
    body: String,

},
    { timestamps: true }
);

module.exports = commentSchema;