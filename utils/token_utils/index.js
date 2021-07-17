const jwt = require('jsonwebtoken');
const getUserIDFromToken = (token) => {
    jwt.verify(token, process.env.JWT_TOKEN_SECRET, (error, userID) => {
        if (error) return { found: false, user_id: null };
        return { found: true, user_id: userID.username }

    });
}
module.exports = { getUserIDFromToken };