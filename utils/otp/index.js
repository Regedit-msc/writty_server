const { randomBytes } = require("crypto")
const genOTP = (end) => {
    return randomBytes(64).toString("hex").substr(0, end);
}
module.exports = genOTP;