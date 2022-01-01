const { getTagFeed } = require("../controllers/tag");
const { paginateTags } = require("../middlewares/paginated_tag_feed");
const isUserVerified = require("../middlewares/verify_user");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/";
router.get("/tags", extractJWT, isUserVerified, paginateTags, getTagFeed);

module.exports = { router, path };
