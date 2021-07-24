const Message = require("../Message");
const Room = require("../Room");
const _ = require("lodash");

const getRooms = async (req, res, next) => {
    const { username } = req.locals
    const rooms = await Room.find({ "participants.user": username }).populate("participants.user")
    const newArr = [];
    for (let i = 0; i < rooms.length; i++) {
        const lastMessage = (await Message.find({ room: rooms[i].roomID }).populate("user").sort({ createdAt: -1 }).limit(1))[0]
        const notYou = (rooms[i].participants.filter(u => u?.user?._id != username))[0];
        newArr.push({ lastMessage: _.pick(lastMessage, ["_id", "user.username", "body", "type", "format", "createdAt"]), userTOChat: _.pick(notYou, ["_id", "user.username", "user.profileImageUrl"]) });
    }
    const arrToSend = newArr.sort(function (a, b) {
        var keyA = new Date(a?.lastMessage?.createdAt),
            keyB = new Date(b?.lastMessage?.createdAt);
        if (keyA < keyB) return 1;
        if (keyA > keyB) return -1;
        return 0;
    });
    console.log(arrToSend);
    res.status(200).json({ message: arrToSend, success: true });
}




module.exports = { getRooms };