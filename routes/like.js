const { like } = require("../controllers/like");
const cleanCache = require("../utils/cleanCache");
const { extractJWT } = require("../utils/jwt");

const router = require("express").Router();
const path = "/"
router.post("/like", cleanCache, extractJWT, like);


module.exports = { router, path }