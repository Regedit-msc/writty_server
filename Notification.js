const mongoose = require('mongoose');


const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'user',
    },
    body: String,
    from: {
        type: mongoose.Schema.Types.ObjectId, ref: 'user',
    },
}, { timestamps: true })

const Notification = new mongoose.model('notification', notificationSchema)

module.exports = Notification;
