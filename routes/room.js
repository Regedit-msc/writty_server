const { getRooms } = require("../controllers/room");

const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/"
router.get("/rooms", extractJWT, getRooms);


module.exports = { router, path }