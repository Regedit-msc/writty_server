const { createQuestion } = require("../controllers/question");
const isUserVerified = require("../middlewares/verify_user");
const cleanCache = require("../utils/cleanCache");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/";
router.post(
  "/create/question",
  cleanCache,
  extractJWT,
  isUserVerified,
  createQuestion
);

module.exports = { router, path };
