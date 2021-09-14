const mongoose = require('mongoose');

const participantsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'user'
    },
})
const roomSchema = new mongoose.Schema({
    roomID: String,
    participants: [participantsSchema]

}, { timestamps: true });




const Room = new mongoose.model('room', roomSchema)

module.exports = Room;