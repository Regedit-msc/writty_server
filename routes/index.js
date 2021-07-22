const router = require("express").Router();
const authRoutes = require("./auth");
const likeRoutes = require("./like");
const notificationRoute = require("./notification")
const userRoutes = require("./user");
const docRoutes = require("./docs");

const path = "/"
router.use(authRoutes.path, authRoutes.router);
router.use(likeRoutes.path, likeRoutes.router);
router.use(notificationRoute.path, notificationRoute.router);
router.use(docRoutes.path, docRoutes.router);
router.use(userRoutes.path, userRoutes.router);
module.exports = { router, path };