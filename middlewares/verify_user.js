const { findUser } = require("../utils/user_utils");

const isUserVerified = async (req, res, next) => {
    const { username: userID } = req.locals;
    const { found, user } = await findUser({ _id: userID });
    if (found) {
        if (user.isVerified || user.isVerified === "true") {
            next();
        } else {
            return res.status(200).json({ message: 'Account not verified. Attempt to re-register.', success: false });
        }
    }
}
module.exports = isUserVerified;