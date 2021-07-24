const { details, userDetailsShort, profileImage } = require("../controllers/user");
const cleanCache = require("../utils/cleanCache");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/"
router.get("/details", extractJWT, details);
router.get("/user/name", extractJWT, userDetailsShort);
router.post('/profile/image', cleanCache, extractJWT, profileImage)
module.exports = { router, path }