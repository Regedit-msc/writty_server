const { paginatedToFollow } = require("../controllers/tofollow");
const { paginateToFollow } = require("../middlewares/paginated_tofollow");
const isUserVerified = require("../middlewares/verify_user");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/";
router.get(
  "/tofollow",
  extractJWT,
  isUserVerified,
  paginateToFollow,
  paginatedToFollow
);

module.exports = { router, path };
