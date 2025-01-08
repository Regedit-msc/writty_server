const { getUsersByLanguage } = require("../controllers/language");
const isUserVerified = require("../middlewares/verify_user");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/";
router.get("/badge", extractJWT, isUserVerified, getUsersByLanguage);

module.exports = { router, path };
