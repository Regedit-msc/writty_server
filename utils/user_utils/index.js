
const User = require('../../User');
const bcrypt = require("bcrypt");
const { AvatarGenerator } = require('random-avatar-generator');
const generator = new AvatarGenerator();

async function createUser(username, email, password) {
    const rounds = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, rounds);

    const user = await User.create({
        username: username,
        email: email,
        password: passwordHash,
        profileImageUrl: generator.generateRandomAvatar(username)
    });

    if (user) {
        return { saved: true };
    } else {
        return { saved: false };
    }
}




const updateUser = async (searchParam, propertyToUpdate) => {
    try {
        const user = await User.findOneAndUpdate(
            searchParam,
            { $set: propertyToUpdate },
            { upsert: true, new: true }
        ).lean().exec();
        if (user) return { updated: true, user };
        return { updated: false };
    } catch {
        return { updated: false };
    }
}


const findUser = async (searchParam) => {
    try {
        const user = await User.findOne(
            searchParam
        ).lean().exec();
        if (user) return { found: true, user };
        return { found: false };
    } catch {
        return { found: false };
    }
}

const getAllUsers = async () => {
    try {
        const users = await User.find({}).select('name email registrationMonth').lean().exec()
        if (users) return { foundUsers: true, users };
        return { foundUsers: false };
    } catch {
        return { foundUsers: false };
    }
}


const deleteUser = async (searchParam) => {
    try {
        const done = await User.deleteOne(searchParam);
        if (done.deletedCount > 0) return { deleted: true };
        return { deleted: false };
    } catch {
        return { deleted: false };
    }
}

module.exports = {
    updateUser,
    findUser,
    getAllUsers,
    deleteUser,
    createUser
}
