const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema({
    username: { type: String },
    email: { type: String },
    password: { type: String },
    created_at: { type: Date, default: Date.now() },
    otp: String,
    profileImageUrl: {
        type: String,
    },
    actalName: String,
    sub: {
        type: Object || String
    },
    sId: String,
    provider: String,
    gitHubUrl: String,
    blog: String,
    socialLinks: [],
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: Object,
        default: null
    },
    userLanguages: [],
    userSkills: [],
    about: String,
    finishedProfileUpdate: {
        type: Boolean,
        default: false
    },
    experience: []
})


userSchema.statics.login = async function (username, password) {
    console.log('ran')
    const user = await this.findOne({ username }).lean();
    if (user) {
        const same = await bcrypt.compare(password, user.password);
        console.log("The same", same);
        if (same) {

            return user;
        }
        throw Error("incorrect password");
    }
    throw Error("incorrect username");
};

userSchema.statics.register = async function (email, username) {
    if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)) {

        const user = await this.findOne({ email }).lean();
        if (user) {
            throw Error("email already exists");

        } else {
            const userName = await this.findOne({ username }).lean();
            if (userName) {
                throw Error("email already exists");
            } else {
                return null;
            }
        }

    } else {
        throw Error("invalid emailaddress");
    }
};

const User = new mongoose.model('user', userSchema)

module.exports = User;




