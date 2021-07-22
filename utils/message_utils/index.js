const Message = require('../../Message');
const findMessages = async (searchParam) => {
    try {
        const messages = await Message.find(
            searchParam
        ).populate([{
            path: 'user',
            select: "username profileImageUrl",
        }]).lean().exec();
        if (messages) return { found: true, messages };
        return { found: false };
    } catch {
        return { found: false };
    }
}

module.exports = {
    findMessages
}