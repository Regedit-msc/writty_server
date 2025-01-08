const { getRooms } = require("../controllers/room");
const isUserVerified = require("../middlewares/verify_user");

const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/"
router.get("/rooms", extractJWT, isUserVerified, getRooms);


module.exports = { router, path }