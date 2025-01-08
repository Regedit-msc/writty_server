const { createImagePost } = require("../controllers/image_post");
const isUserVerified = require("../middlewares/verify_user");
const cleanCache = require("../utils/cleanCache");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/";
router.post(
  "/create/image_post",
  cleanCache,
  extractJWT,
  isUserVerified,
  createImagePost
);

module.exports = { router, path };
