const { findUser, updateUser } = require("../utils/user_utils");
const _ = require("lodash");
const { getAllDocsByUsers } = require("../utils/doc_utils");
const { imagekit } = require("../utils/imageKit");
const sharp = require('sharp');
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
    const base64Image = `data:image/${type};base64,${b64}`;
    let parts = base64Image.split(';');
    let imageData = parts[1].split(',')[1];
    var img = Buffer.from(imageData, 'base64');
    sharp(img)
        .resize(460, 460).webp({ lossless: true }).toBuffer()
        .then(resizedImageBuffer => {
            let resizedImageData = resizedImageBuffer.toString('base64');
            imagekit.upload({
                file: resizedImageData,
                fileName: `profile_image_from_live_gists.webp`,
            }, async function (error, result) {
                if (error) return console.log(error);
                await updateUser({ _id: username }, { profileImageUrl: result.url })
                res.status(200).json({ message: result?.url ?? '', success: true })
            });
        })
        .catch(error => {
            res.status(200).json({ message: "Error uploading image", success: false })
        })

}


module.exports = { details, userDetailsShort, profileImage }