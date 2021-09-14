const Notification = require("../../models/Notification");


const findNotifications = async (searchParam) => {
    try {
        const notifications = await Notification.find(
            searchParam
        ).populate([{
            path: 'user',
            select: "username profileImageUrl",
        }, {
            path: 'from',
            select: "username profileImageUrl",
        }]).lean().exec();
        if (notifications) return { found: true, notifications };
        return { found: false };
    } catch {
        return { found: false };
    }
}



async function createNotification(user, body, from) {

    const notification = await Notification.create({
        user,
        body,
        from
    });

    if (notification) {
        return { saved: true };
    } else {
        return { saved: false };
    }
}

module.exports = {
    createNotification,
    findNotifications
}