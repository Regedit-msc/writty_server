const { pick, keys, isEqual } = require("lodash")
const passport = require("passport")
const { Strategy: GStrategy } = require("passport-google-token")
const User = require("../models/User")
const { findUser, updateUser } = require("../utils/user_utils");
const GitHubTokenStrategy = require('passport-github-token');
const { clearHash } = require("../utils/cache");
const { v4: uuidv4 } = require("uuid");

const cb = async (accessToken, refreshToken, profile, done) => {
  const pUser =
    profile.provider === "google"
      ? {
          actualName: profile._json.name,
          username:
            profile._json.family_name[0] +
            profile._json.given_name[0] +
            uuidv4().substring(0, 4),
          email: profile.emails ? profile.emails[0].value : "no_email",
          provider: profile.provider,
          profileImageUrl: profile._json.picture,
          sId: profile.id,
          isVerified: true,
        }
      : {
          actualName: profile._json.name,
          username: profile.username,
          email: profile.emails ? profile.emails[0].value : "no_email",
          provider: profile.provider,
          profileImageUrl: profile._json.avatar_url,
          sId: profile.id,
          gitHubUrl: profile._json.url,
          isVerified: true,
        };
  const { found, user } = await findUser({ email: pUser.email });
  if (!found) {
    const newUser = await User.create(pUser);
    return done(null, newUser);
  }
  const oldPUser = pick(
    user,
    keys({
      actualName: null,
      provider: null,
      sId: null,
    })
  );
  const newPUser = pick(
    pUser,
    keys({
      actualName: null,
      provider: null,
      sId: null,
    })
  );
  if (!isEqual(newPUser, oldPUser)) {
    const { updated, user: updatedUser } = await updateUser(
      { email: pUser.email },
      { isVerified: true, ...newPUser }
    );
    clearHash(updatedUser._id);
    if (updated) {
      return done(null, updatedUser);
    }
  }
  return done(null, user);
};

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