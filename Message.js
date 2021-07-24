const mongoose = require('mongoose');


const messageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'user',
    },
    body: String,
    room: String,
    type: String,
    format: String,
    caption: String

}, { timestamps: true })

const Message = new mongoose.model('message', messageSchema)

module.exports = Message;
