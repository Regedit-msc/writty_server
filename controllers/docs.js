
const { getAllDocsByUsers, createDoc, deleteDoc, updateDoc, findDoc } = require("../utils/doc_utils");
const { findUser } = require("../utils/user_utils");
const webPush = require("../utils/push_utils/index");
const _ = require("lodash")
const { createNotification } = require("../utils/notification_utils");

const paginatedPub = async (req, res, next) => {
    res.status(200).json({ message: res.paginatedResults, success: true })

}




const detailsPublic = async (req, res, next) => {
    const { name } = req.query;
    const { found, user } = await findUser({ username: name });
    if (!found) return res.status(200).json({ message: "User not found", success: false });
    const { docs } = await getAllDocsByUsers({ user: user._id, private: false });
    res.status(200).json({
        message: {
            experience: user?.experience ?? [],
            languages: user?.userLanguages ?? [],
            skills: user?.userSkills ?? [],
            about: user?.about ?? '',
            image: user?.profileImageUrl ?? '',
            code: docs,
            name: user.name,
            email: user.email,
            userID: user._id
        }, success: true
    })

}

const pubDocs = async (req, res, next) => {
    const { foundDocs, docs } = await getAllDocsByUsers({ private: false });
    res.status(200).json({
        message: _.map(docs, object => {
            return _.omit(object, ['_id'])
        }), success: foundDocs
    })
}

const createDocument = async (req, res, next) => {
    const { name, _id, language, private, publicLink, data } = req.body;
    const { username } = req.locals;
    const { found, user } = await findUser({ _id: username });
    if (found) {
        const { saved } = await createDoc(name, _id, user._id, language.trim(), private, publicLink, data);

        if (saved) return res.status(200).json({ message: "New document created", success: true })
    }
}



const searchDocs = async (req, res, next) => {
    const { wol } = req.query;
    const { foundDocs, docs } = await getAllDocsByUsers({ name: { $regex: (new RegExp(wol.replace(/^"(.*)"$/, '$1'))), $options: "i" }, private: false })
    if (foundDocs) {
        res.status(200).json({ message: docs, success: true })
    }
}

const deleteDocument = async (req, res, next) => {
    const { docID } = req.body;
    const { username } = req.locals;
    const { deleted } = await deleteDoc({ _id: docID, user: username });
    if (deleted) {

        return res.status(200).json({ message: "Deleted doc ", success: true })
    }
    res.status(200).json({ message: "Failed to delete doc ", success: false })
}


const updateVisibility = async (req, res, next) => {
    const { username } = req.locals;
    const { docID } = req.body;
    const { doc } = await findDoc({ _id: docID, user: username });
    const { updated } = await updateDoc({ _id: docID }, { private: !(doc.private) })
    res.status(200).json({ message: "Updated doc visibility.", success: updated })
}

const createCollab = async (req, res, next) => {
    const { docID, collabLink } = req.body;
    const { updated } = await updateDoc({ _id: docID }, { collabLink })
    res.status(200).json({ message: "Created collab link.", success: updated })
}


const deleteCollab = async (req, res, next) => {
    const { docID } = req.body;
    const { updated } = await updateDoc({ _id: docID }, { collabLink: null })
    res.status(200).json({ message: "Deleted collab link.", success: updated })
}

const getComments = async (req, res, next) => {
    const { id } = req.query;
    const { doc } = await findDoc({ publicLink: id });
    res.status(200).json({ message: doc?.comments, success: true })
}
const getCode = async (req, res, next) => {
    const { id } = req.query;
    const { found, doc } = await findDoc({ publicLink: id });
    if (!found) return res.status(200).json({ message: "No code found", success: false })
    res.status(200).json({ message: doc, success: true })
}


const createComment = async (req, res, next) => {
    const { username } = req.locals;
    const { publicLink, body } = req.body;
    const { doc } = await findDoc({ publicLink });
    function doCheck(id) {
        if (doc.user._id == id) return true;
        return false;
    }
    const { user } = await findUser({ _id: username });
    const payload = JSON.stringify({
        title: 'Comment',
        body: `${doCheck(username) ? "You" : user.username} commented on your gist.`,
    })
    webPush.sendNotification(doc.user.sub, payload)
        .then(result => console.log(result))
    await createNotification(doc.user._id, `${doCheck(username) ? "You" : user.username} commented on your gist.`, username);
    const { updated } = await updateDoc({ _id: doc._id }, { comments: [...doc.comments, { user: username, body }] });
    res.status(200).json({ message: "Commented on some code.", success: updated })

}

module.exports = { detailsPublic, paginatedPub, pubDocs, createDocument, searchDocs, deleteDocument, updateVisibility, createCollab, deleteCollab, getComments, getCode, createComment }