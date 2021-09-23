const {
  details,
  userDetailsShort,
  profileImage,
  searchUsers,
  onboardUser,
  follow,
} = require("../controllers/user");
const isUserVerified = require("../middlewares/verify_user");
const cleanCache = require("../utils/cleanCache");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/";
router.get("/details", extractJWT, isUserVerified, details);
router.get("/user/name", extractJWT, isUserVerified, userDetailsShort);
router.post(
  "/profile/image",
  cleanCache,
  extractJWT,
  isUserVerified,
  profileImage
);
router.get("/search/users", extractJWT, isUserVerified, searchUsers);
router.post("/onboard/user", cleanCache, extractJWT, onboardUser);
router.post("/user/follow", cleanCache, extractJWT, isUserVerified, follow);
module.exports = { router, path };
