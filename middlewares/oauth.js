const { pick, keys, isEqual } = require("lodash")
const passport = require("passport")
const { Strategy: GStrategy } = require("passport-google-token")
const User = require("../User")
const { findUser, updateUser } = require("../utils/user_utils");
const GitHubTokenStrategy = require('passport-github-token');


const cb = async (accessToken, refreshToken, profile, done) => {
    console.log(profile, "here");
    const pUser = profile.provider === "google" ? {
        actualName: profile._json.name,
        username: profile._json.family_name[0] + profile._json.given_name[0],
        email: profile.emails ? profile.emails[0].value : "no_email",
        provider: profile.provider,
        profileImageUrl: profile._json.picture,
        sId: profile.id
    } : {
        actualName: profile._json.name,
        username: profile.username,
        email: profile.emails ? profile.emails[0].value : "no_email",
        provider: profile.provider,
        profileImageUrl: profile._json.avatar_url,
        sId: profile.id,
        gitHubUrl: profile._json.url,
    };
    const { found, user } = await findUser({ email: pUser.email });
    if (!found) {
        const newUser = await User.create(pUser);
        return done(null, newUser);
    }
    const oldPUser = pick(user, keys({
        actualName: null,
        provider: null,
        profileImageUrl: null,
        sId: null
    }));
    const newPUser = pick(pUser, keys({
        actualName: null,
        provider: null,
        profileImageUrl: null,
        sId: null
    }));
    if (!isEqual(newPUser, oldPUser)) {
        const { updated, user: updatedUser } = await updateUser({ email: pUser.email }, newPUser);
        if (updated) {
            return done(null, updatedUser)
        }
    }
    return done(null, user);
}

passport.use(
    new GStrategy(
        {
            clientID: process.env.G_CLIENT_ID,
            clientSecret: process.env.G_CLIENT_SECRET
        },
        cb
    )
)
passport.use(new GitHubTokenStrategy({
    clientID: process.env.GH_CLIENT_ID,
    clientSecret: process.env.GH_CLIENT_SECRET,
    passReqToCallback: false,
    scope: 'user:email',
},
    cb
));

module.exports = { passport }