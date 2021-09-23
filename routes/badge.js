const { getUsersByBadge } = require("../controllers/badges");
const isUserVerified = require("../middlewares/verify_user");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/";
router.get("/badge", extractJWT, isUserVerified, getUsersByBadge);

module.exports = { router, path };
