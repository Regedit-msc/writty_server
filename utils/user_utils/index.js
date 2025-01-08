
const User = require('../../models/User');
const bcrypt = require("bcrypt");
const { AvatarGenerator } = require('random-avatar-generator');
const generator = new AvatarGenerator();

async function createUser(username, email, password, otp = null) {
    const rounds = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, rounds);

    const user = await User.create(otp ? {
        username: username,
        email: email,
        password: passwordHash,
        profileImageUrl: generator.generateRandomAvatar(username),

    } : {
        username: username,
        email: email,
        password: passwordHash,
        profileImageUrl: generator.generateRandomAvatar(username),
        otp: otp
    });

    if (user) {
        return { saved: true, user };
    } else {
        return { saved: false, user };
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
    } catch (e) {

        return { updated: false };
    }
}


const findUser = async (searchParam) => {

    try {
        if (Object.keys(searchParam).includes("_id")) {
            const user = await User.findOne(
                searchParam
            ).cache({ key: searchParam._id })
            if (user) return { found: true, user };
            return { found: false };
        } else {
            const user = await User.findOne(
                searchParam
            ).lean().exec();
            if (user) return { found: true, user };
            return { found: false };
        }
    } catch (e) {
        console.log(e);
        return { found: false };
    }
}

const getAllUsers = async (searchParam = {}) => {
  try {
    const users = await User.find(searchParam)
      .select("username email  profileImageUrl about userSkills")
      .lean()
      .exec();
    if (users) return { foundUsers: true, users };
    return { foundUsers: false };
  } catch {
    return { foundUsers: false };
  }
};


const deleteUser = async (searchParam) => {
    try {
        const done = await User.deleteOne(searchParam);
        if (done.deletedCount > 0) return { deleted: true };
        return { deleted: false };
    } catch {
        return { deleted: false };
    }
}

const getAllUsersByName = async (username, scopes) => {
    try {
        //TODO: optimize
        const users = await User.find({ username }).select(scopes).lean().exec();
        if (users) return { foundUsers: true, users };
    } catch {
        return { foundUsers: false };
    }
}

module.exports = {
    getAllUsersByName,
    updateUser,
    findUser,
    getAllUsers,
    deleteUser,
    createUser
}
