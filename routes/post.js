const { createPost } = require("../controllers/post");
const isUserVerified = require("../middlewares/verify_user");
const cleanCache = require("../utils/cleanCache");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/";
router.post("/create/post", cleanCache, extractJWT, isUserVerified, createPost);

module.exports = { router, path };
