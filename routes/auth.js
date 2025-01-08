const { login, register, passportLogin, verifyUserEmail, issueNewOTP, forgotPassword, issueVerifiedOtp } = require("../controllers/auth");
const { passport } = require("../middlewares/oauth");
const axios = require("axios");
const { extractJWT } = require("../utils/jwt");
const router = require("express").Router();
const getGithubToken = async (req, res, next) => {
    const code = req.body.code;
    const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GH_CLIENT_ID,
        client_secret: process.env.GH_CLIENT_SECRET,
        code: code
    }, {
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Accept': 'application/json'
        }
    });
    console.log(response.data);
    req.query["access_token"] = response.data.access_token;
    req.body["access_token"] = response.data.access_token;
    next();
}

const path = "/"
router.post("/login", login);
router.post("/register", register);
router.post("/login/google", passport.authenticate("google-token", { session: false }), passportLogin);
router.post("/login/github", getGithubToken, passport.authenticate("github-token", { session: false }), passportLogin);
router.post("/verify/email", extractJWT, verifyUserEmail);
router.get("/issue/registration/otp", extractJWT, issueNewOTP);
router.post("/reset/password", extractJWT, forgotPassword);
router.post("/issue/verified/otp", issueVerifiedOtp)

module.exports = { router, path }