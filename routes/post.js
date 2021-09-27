const { createPost } = require("../controllers/post");
const isUserVerified = require("../middlewares/verify_user");
const { clearHash } = require("../utils/cache");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/";
router.post("/create/post", clearHash, extractJWT, isUserVerified, createPost);

module.exports = { router, path };
