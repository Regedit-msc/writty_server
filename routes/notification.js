const {
  notificationc,
  notificationsGet,
  paginatedNotifications,
} = require("../controllers/notificationc");
const {
  paginateNotifications,
} = require("../middlewares/paginate_notifications");
const isUserVerified = require("../middlewares/verify_user");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/";
router.post(
  "/notifications/subscribe",
  extractJWT,
  isUserVerified,
  notificationc
);
router.post(
  "/notifications/user",
  extractJWT,
  isUserVerified,
  notificationsGet
);
router.get("/notifications", extractJWT, isUserVerified, notificationsGet);
router.get(
  "/notifications/paginated",
  extractJWT,
  isUserVerified,
  paginateNotifications,
  paginatedNotifications
);
module.exports = { router, path };
