
const Doc = require("../../Document");
const generateTheme = require("../theme");

async function createDoc(name, _id, userID, lang, private, publicLink) {

    const doc = await Doc.create({
        name,
        _id,
        user: userID,
        language: lang,
        private,
        publicLink,
        theme: generateTheme()
    });

    if (doc) {
        return { saved: true };
    } else {
        return { saved: false };
    }
}


const updateDoc = async (searchParam, propertyToUpdate) => {
    try {
        const doc = await Doc.findOneAndUpdate(
            searchParam,
            { $set: propertyToUpdate },
            { upsert: true, new: true }
        ).lean().exec();
        if (doc) return { updated: true, doc };
        return { updated: false };
    } catch {
        return { updated: false };
    }
}

const findDoc = async (searchParam) => {
    try {
        const doc = await Doc.findOne(
            searchParam
        ).populate([{
            path: 'user',
            select: "username profileImageUrl sub",

        }, {
            path: 'comments.user',
            select: "username profileImageUrl sub",
        }]).lean().exec();
        if (doc) return { found: true, doc };
        return { found: false };
    } catch {
        return { found: false };
    }
}

const getAllDocsByUsers = async (searchParam) => {
    try {
        if (Object.keys(searchParam).includes("user")) {
            const docs = await Doc.find(searchParam).populate({ path: "user", select: "username profileImageUrl" }).select('name user language private publicLink collabLink data theme comments createdAt likes').sort({ createdAt: 'desc' }).cache({ key: searchParam.user });
            if (docs) return { foundDocs: true, docs };
            return { foundDocs: false };
        }
        const docs = await Doc.find(searchParam).populate({ path: "user", select: "username profileImageUrl" }).select('name user language private publicLink collabLink data theme comments createdAt likes').sort({ createdAt: 'desc' }).lean().exec()
        if (docs) return { foundDocs: true, docs };
        return { foundDocs: false };
    } catch {
        return { foundDocs: false };
    }
}



const deleteDoc = async (searchParam) => {
    try {
        const done = await Doc.deleteOne(searchParam);
        if (done.deletedCount > 0) return { deleted: true };
        return { deleted: false };
    } catch {
        return { deleted: false };
    }
};
module.exports = {
    deleteDoc,
    getAllDocsByUsers,
    findDoc,
    createDoc,
    updateDoc
}