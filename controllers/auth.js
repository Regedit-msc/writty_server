const User = require("../User");
const { clearHash } = require("../utils/cache");
const ErrorHandling = require("../utils/errors");
const { signJWT } = require("../utils/jwt");
const { createUser } = require("../utils/user_utils");

const login = async (req, res, next) => {
    const { username, password } = req.body
    try {
        const user = await User.login(username, password);
        if (user) {
            signJWT(user._id, null, (err, token) => {
                if (err) return res.status(200).json({ message: 'Could not sign token ', success: false });
                res.status(200).json({ message: token, success: true })
            })
        }

    } catch (error) {
        const newError = ErrorHandling.handleErrors(error);
        res.status(200).json({ message: newError?.message, success: false })
    }

}



const register = async (req, res, next) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(200).json({ message: "Fill out all the required fields", success: false });
    try {
        const something = await User.register(email, username);
        if (something) return res.status(200).json({ message: "Email or username already exists.", success: false });

        const { saved } = await createUser(username, email, password);

        if (saved) return res.status(200).json({ message: 'Created new account', success: true });

    } catch (error) {
        const newError = ErrorHandling.handleErrors(error);
        res.status(200).json({ message: newError.message, success: false })
    }
}
const passportLogin = (req, res, next) => {

    signJWT(req.user._id, null, (err, token) => {
        if (err) return res.status(200).json({ message: 'Could not sign token ', success: false });
        res.status(200).json({ message: token, success: true })
    });
    clearHash(req.user._id);
}



module.exports = { login, register, passportLogin }