const { notificationc } = require("../controllers/notificationc");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/"
router.post('/notifications/subscribe', extractJWT, notificationc);
module.exports = { router, path }