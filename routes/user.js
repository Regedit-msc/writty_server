const { details, userDetailsShort, profileImage } = require("../controllers/user");
const isUserVerified = require("../middlewares/verify_user");
const cleanCache = require("../utils/cleanCache");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/"
router.get("/details", extractJWT, isUserVerified, details);
router.get("/user/name", extractJWT, isUserVerified, userDetailsShort);
router.post('/profile/image', cleanCache, extractJWT, isUserVerified, profileImage)
module.exports = { router, path }