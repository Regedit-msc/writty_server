const { clearHash } = require("./cache");

module.exports = async function (req, res, next) {
    await next();
    clearHash(req.locals.username || "default");
}