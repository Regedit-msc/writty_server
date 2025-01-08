const { createSnippet } = require("../controllers/snippet");
const isUserVerified = require("../middlewares/verify_user");
const { clearHash } = require("../utils/cache");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/";
const cleanCache = require("../utils/cleanCache");
router.post(
  "/create/snippet",
  cleanCache,
  extractJWT,
  isUserVerified,
  createSnippet
);

module.exports = { router, path };
