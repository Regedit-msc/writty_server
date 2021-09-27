const { createSnippet } = require("../controllers/snippet");
const isUserVerified = require("../middlewares/verify_user");
const { clearHash } = require("../utils/cache");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/";
router.post(
  "/create/snippet",
  clearHash,
  extractJWT,
  isUserVerified,
  createSnippet
);

module.exports = { router, path };
