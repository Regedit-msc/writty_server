const { login, register } = require("../controllers/auth");

const router = require("express").Router();
const path = "/"
router.post("/login", login);
router.post("/register", register);

module.exports = { router, path }