const jwt = require('jsonwebtoken');
const getUserIDFromToken = (token, cb) => {
    jwt.verify(token, process.env.JWT_TOKEN_SECRET, (error, userID) => {
        // console.log(userID)
        if (error) return cb({ found: false, user_id: null });
        return cb({ found: true, user_id: userID?.username })
    });
}
module.exports = { getUserIDFromToken };