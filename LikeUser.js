const mongoose = require("mongoose");


const LikeUserSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'user',
        required: true,
    }
})
module.exports = LikeUserSchema;