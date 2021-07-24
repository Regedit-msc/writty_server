const { findUser } = require("../utils/user_utils");
const _ = require("lodash");
const { getAllDocsByUsers } = require("../utils/doc_utils");
const { imagekit } = require("../utils/imageKit");
const details = async (req, res, next) => {
    const { username } = req.locals;
    const { found, user } = await findUser({ _id: username });
    if (found) {
        const { foundDocs, docs } = await getAllDocsByUsers({ user: username });

        if (foundDocs) return res.status(200).json({ message: docs, username: user.username, success: true, image: user.profileImageUrl, uid: user._id });
    }
    res.status(200).json({ message: "No details found", success: false });

}


const userDetailsShort = async (req, res, next) => {
    const { username } = req.locals;
    const { user } = await findUser({ _id: username });
    res.status(200).json({ message: _.pick(user, ["profileImageUrl", "username", "_id"]), success: true })
}



const profileImage = async (req, res, next) => {
    const { username } = req.locals
    const { b64, type } = req.body;
    imagekit.upload({
        file: b64,
        fileName: `profile_image_from_live_gists.${type}`,
    }, async function (error, result) {
        if (error) return console.log(error);
        await updateUser({ _id: username }, { profileImageUrl: result.url })
        res.status(200).json({ message: result?.url ?? '', success: true })
    });
}


module.exports = { details, userDetailsShort, profileImage }