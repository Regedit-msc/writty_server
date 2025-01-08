const { paginatedFeed } = require("../controllers/feed");
const { paginateFeed } = require("../middlewares/paginated_feed");
const isUserVerified = require("../middlewares/verify_user");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/";
router.get("/feed", extractJWT, isUserVerified, paginateFeed, paginatedFeed);

module.exports = { router, path };
