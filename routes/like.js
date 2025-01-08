const { like } = require("../controllers/like");
const isUserVerified = require("../middlewares/verify_user");
const cleanCache = require("../utils/cleanCache");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/"
router.post("/like", cleanCache, extractJWT, isUserVerified, like);


module.exports = { router, path }