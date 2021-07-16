const jwt = require('jsonwebtoken');
const { findUser } = require("../user_utils/index");


const signJWT = (username, expires, callback) => {
    try {
        jwt.sign(
            {
                username: username,
            },
            process.env.JWT_TOKEN_SECRET,
            expires ? { expiresIn: expires } : { expiresIn: '3h' },
            (error, token) => {
                if (error) {
                    callback(error, null);
                } else if (token) {
                    callback(null, token);
                }
            }
        );
    } catch (error) {
        callback(error, null);
    }
};



/// This should be its own function in a middleware folder
const extractJWT = (req, res, next) => {

    let authHeader = req.headers['authorization'];
    const userToken = authHeader && authHeader.split(' ')[1]

    if (!userToken) return res.status(404).json({ Message: "Unauthorized access" });


    jwt.verify(userToken, process.env.JWT_TOKEN_SECRET, (error, userID) => {
        // console.log("jwt c", userID + userToken);
        if (error) return res.status(404).json({ Message: "Unauthorized access expired token" });
        req.locals = userID;
        req.token = userToken;
        next();

    });

}
/// This should also be its own function in a middleware folder
const checkJWT = async (req, res, next) => {

    try {
        console.log('rann..')
        const token = req.token;
        const userid = req.locals;
        const { found, user } = await findUser({ _id: userid.username });
        console.log('rannnn')
        if (!found) return res.status(404).json({ message: "Unauthorized access" });
        if (user.token.trim().toString() !== token.trim().toString()) return res.status(404).json({ message: "Unauthorized access" });
        next();
    } catch {
        return res.status(404).json({ Message: "Unauthorized access" })
    }
}



/// This should also be its own function in a middleware folder
const checkAdminJWT = async (req, res, next) => {
    try {
        const userid = req.locals;
        if (!userid) return res.status(404).json({ Message: 'Failed to authenticate admin', success: false });
        if (userid.username !== process.env.ADMIN_NAME) return res.status(404).json({ Message: 'Failed to authenticate admin', success: false });

        next();
    } catch {
        return res.status(404).json({ Message: "Unauthorized access" })
    }
}



module.exports = {
    signJWT,
    extractJWT,
    checkJWT,
    checkAdminJWT
}
