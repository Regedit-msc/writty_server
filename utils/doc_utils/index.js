
const Doc = require("../../Document");

async function createDoc(name, _id, userID, lang, private, publicLink) {

    const doc = await Doc.create({
        name,
        _id,
        user: userID,
        language: lang,
        private,
        publicLink,
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
        ).populate({ path: "user", select: "username" }).lean().exec();
        if (doc) return { found: true, doc };
        return { found: false };
    } catch {
        return { found: false };
    }
}

const getAllDocsByUser = async (searchParam) => {
    try {
        const docs = await Doc.find(searchParam).populate({ path: "user", select: "username" }).select('name user language private publicLink collabLink data').lean().exec()
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
    getAllDocsByUser,
    findDoc,
    createDoc,
    updateDoc
}