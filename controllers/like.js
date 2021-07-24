const { findDoc, updateDoc } = require("../utils/doc_utils");
const { createNotification } = require("../utils/notification_utils");
const { findUser } = require("../utils/user_utils");
const webPush = require("../utils/push_utils/index")

const like = async (req, res, next) => {
    const { username } = req.locals;
    const { publicLink } = req.body;
    const { user } = await findUser({ _id: username })
    const { doc } = await findDoc({ publicLink });
    const alreadyLiked = doc?.likes.findIndex((e) => e.user == username);
    function doCheck(id) {
        if (doc.user._id == id) return true;
        return false;
    }

    if (alreadyLiked === -1) {
        const { updated } = await updateDoc({ _id: doc._id }, { likes: [...doc.likes, { user: username }] });
        const payload = JSON.stringify({
            title: 'Like',
            body: `${doCheck(username) ? "You" : user.username} reacted to your gist.`,
            image: user.profileImageUrl,
        })
        webPush.sendNotification(doc.user.sub, payload)
            .then(result => console.log(result))
            .catch(e => console.log("Push failed"))

        await createNotification(doc.user._id, `${doCheck(username) ? "You" : user.username} reacted to your gist.`, username);
        if (updated) return res.status(200).json({ message: "Liked code.", success: true });

    } else {

        const { updated } = await updateDoc({ _id: doc._id }, { likes: [...doc.likes.filter(e => e.user != username)] })
        if (updated) return res.status(200).json({ message: "Unliked code.", success: true })
    }

}



module.exports = { like }