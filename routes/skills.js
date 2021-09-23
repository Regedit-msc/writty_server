const { getUsersBySkills } = require("../controllers/skills");
const isUserVerified = require("../middlewares/verify_user");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/";
router.get("/skill", extractJWT, isUserVerified, getUsersBySkills);

module.exports = { router, path };
