const moment = require("moment");
const User = require("../models/User");
const { clearHash } = require("../utils/cache");
const ErrorHandling = require("../utils/errors");
const { signJWT } = require("../utils/jwt");
const { sendRegistrationMail } = require("../utils/mail");
const genOTP = require("../utils/otp");
const bcrypt = require("bcrypt");
const { createUser, findUser, updateUser } = require("../utils/user_utils");

const login = async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const user = await User.login(username, password);
    if (user) {
      if (user.isVerified === false)
        return res
          .status(200)
          .json({
            message: "Account not verified. Please attemt to re-register",
            success: false,
          });

      signJWT(user._id, null, (err, token) => {
        if (err)
          return res
            .status(200)
            .json({ message: "Could not sign token ", success: false });
        res
          .status(200)
          .json({
            message: token,
            profileStatus: user?.finishedProfileUpdate ?? false,
            success: true,
          });
      });
    }
  } catch (error) {
    const newError = ErrorHandling.handleErrors(error);
    res.status(200).json({ message: newError?.message, success: false });
  }
};

const register = async (req, res, next) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res
      .status(200)
      .json({ message: "Fill out all the required fields", success: false });
  if (
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
      email
    )
  ) {
    try {
      const { user, found } = await findUser({ email });
      if (found) {
        // Is already a verified user.
        if (user.isVerified || user.isVerified === "true")
          return res
            .status(200)
            .json({ message: "Email already exists.", success: false });
        // Has already registered but isn't verified
        const OTP = genOTP(6);
        const otpObj = {
          otp: OTP,
          timeIssued: new Date().toISOString(),
        };
        const rounds = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, rounds);
        const { updated, user: updatedUser } = await updateUser(
          { email },
          { username, password: passwordHash, otp: otpObj }
        );
        clearHash(updatedUser._id);
        if (updated) {
          signJWT(updatedUser._id, null, (err, token) => {
            if (err)
              return res
                .status(200)
                .json({ message: "Could not sign token ", success: false });
            res.status(200).json({ message: token, success: true });
          });
          sendRegistrationMail(username, email, OTP);
        }
      } else {
        const { user: usernameUser, found: foundUser } = await findUser({
          username,
        });
        if (
          (foundUser && usernameUser?.isVerified === true) ||
          usernameUser?.isVerified === "true"
        )
          return res
            .status(200)
            .json({ message: "Username is in use.", success: false });
        const OTP = genOTP(6);
        const otpObj = {
          otp: OTP,
          timeIssued: new Date().toISOString(),
        };
        const { saved, user: createdUser } = await createUser(
          username,
          email,
          password,
          otpObj
        );
        clearHash(createdUser._id);
        if (saved) {
          signJWT(createdUser._id, null, (err, token) => {
            if (err)
              return res
                .status(200)
                .json({ message: "Could not sign token ", success: false });
            res.status(200).json({ message: token, success: true });
          });
          sendRegistrationMail(username, email, OTP);
        }
      }
    } catch (error) {
      console.log(error);
      const newError = ErrorHandling.handleErrors(error);
      res.status(200).json({ message: newError?.message, success: false });
    }
  } else {
    res.status(200).json({ message: "Invalid email address", success: false });
  }
};
const passportLogin = (req, res, next) => {
  signJWT(req.user._id, null, (err, token) => {
    if (err)
      return res
        .status(200)
        .json({ message: "Could not sign token ", success: false });
    res
      .status(200)
      .json({
        message: token,
        profileStatus: req.user?.finishedProfileUpdate ?? false,
        success: true,
      });
  });
  clearHash(req.user._id);
};

const verifyUserEmail = async (req, res, next) => {
  const { otp } = req.body;
  const { username: userID } = req.locals;
  if (!otp)
    return res
      .status(200)
      .json({ message: "No OTP provided ", success: false });
  const { found, user } = await findUser({ _id: userID });
  if (found) {
    if (user.otp === null)
      return res.status(200).json({ message: "Invalid OTP", success: false });
    if (new Date() > new Date(moment(user.otp.timeIssued).add(2, "minutes"))) {
      await updateUser({ _id: userID }, { otp: null });
      clearHash(userID);
      return res.status(200).json({ message: "Expired OTP", success: false });
    } else {
      if (user.otp.otp === otp) {
        console.log(user.otp.otp);
        await updateUser({ _id: userID }, { isVerified: true, otp: null });
        clearHash(userID);
        return res
          .status(200)
          .json({ message: "Account verification success.", success: true });
      } else {
        return res.status(200).json({ message: "Invalid OTP", success: false });
      }
    }
  }
};
const issueNewOTP = async (req, res, next) => {
  const { username: userID } = req.locals;
  const { found, user } = await findUser({ _id: userID });
  if (found) {
    if (user.isVerified || user.isVerified === "true") {
      return res
        .status(200)
        .json({ message: "Account already verified.", success: false });
    } else {
      const OTP = genOTP(6);
      const otpObj = {
        otp: OTP,
        timeIssued: new Date().toISOString(),
      };
      const { updated, user: updatedUser } = await updateUser(
        { _id: userID },
        { otp: otpObj }
      );
      clearHash(updatedUser._id);
      if (updated) {
        signJWT(updatedUser._id, null, (err, token) => {
          if (err)
            return res
              .status(200)
              .json({ message: "Could not sign token.", success: false });
          res
            .status(200)
            .json({
              message: "Another otp has been sent to your email.",
              success: true,
            });
        });
        sendRegistrationMail(user.username, email, OTP);
      }
    }
  }
};
const issueVerifiedOtp = async (req, res, next) => {
  const { email } = req.body;
  if (!email)
    return res
      .status(200)
      .json({ message: "No email address provided.", success: false });
  const { found, user } = await findUser({ email });
  if (found) {
    if (!user.isVerified || user.isVerified === false)
      res
        .status(200)
        .json({ message: "Only for verified users.", success: false });
    const OTP = genOTP(6);
    const otpObj = {
      otp: OTP,
      timeIssued: new Date().toISOString(),
    };
    const { updated, user: updatedUser } = await updateUser(
      { _id: user._id },
      { otp: otpObj }
    );
    clearHash(updatedUser._id);
    if (updated) {
      signJWT(updatedUser._id, null, (err, token) => {
        if (err)
          return res
            .status(200)
            .json({ message: "Could not sign token.", success: false });
        res
          .status(200)
          .json({
            message: token,
            extra: "An otp has been sent to your email address.",
            success: true,
          });
      });
      sendRegistrationMail(user.username, email, OTP);
    }
  }
};

const forgotPassword = async (req, res, next) => {
  const { password, otp } = req.body;
  const { username: userID } = req.locals;
  const { found, user } = await findUser({ _id: userID });
  if (found) {
    if (user.isVerified || user.isVerified === "true") {
      if (
        new Date() > new Date(moment(user.otp.timeIssued).add(2, "minutes"))
      ) {
        await updateUser({ _id: user._id }, { otp: null });
        clearHash(userID);
        return res.status(200).json({ message: "Expired OTP", success: false });
      } else {
        console.log(user.otp.otp.toString() === otp.toString());
        if (user.otp.otp.toString() === otp.toString()) {
          const rounds = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash(password, rounds);
          const { updated, user: updatedUser } = await updateUser(
            { _id: user._id },
            { otp: null, password: passwordHash }
          );
          clearHash(userID);
          if (updated) {
            return res
              .status(200)
              .json({ message: "Successfully reset password.", success: true });
          }
          return res.status(200).json({ message: "Failed.", success: false });
        } else {
          console.log("userotp", user.otp.otp);
          return res
            .status(200)
            .json({ message: "Otp incorrect.", success: false });
        }
      }
    } else {
      return res.status(200).json({ message: "Not verified", success: false });
    }
  }
};

module.exports = {
  login,
  register,
  passportLogin,
  verifyUserEmail,
  issueNewOTP,
  issueVerifiedOtp,
  forgotPassword,
};
