const { notificationc, notificationsGet } = require("../controllers/notificationc");
const isUserVerified = require("../middlewares/verify_user");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/"
router.post('/notifications/subscribe', extractJWT, isUserVerified, notificationc);
router.post('/notifications/user', extractJWT, isUserVerified, notificationsGet);
module.exports = { router, path }