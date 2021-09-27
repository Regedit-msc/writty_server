const { createQuestion } = require("../controllers/question");
const isUserVerified = require("../middlewares/verify_user");
const { clearHash } = require("../utils/cache");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/";
router.post(
  "/create/question",
  clearHash,
  extractJWT,
  isUserVerified,
  createQuestion
);

module.exports = { router, path };
