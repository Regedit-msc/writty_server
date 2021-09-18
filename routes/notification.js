const { notificationc } = require("../controllers/notificationc");
const isUserVerified = require("../middlewares/verify_user");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/"
router.post('/notifications/subscribe', extractJWT, isUserVerified, notificationc);
module.exports = { router, path }