const { getAllUsers } = require("../utils/user_utils");
const getUsersByLanguage = async (req, res, next) => {
  const { language } = req.query;
  const { foundUsers, users } = await getAllUsers({ badges: language });
  if (foundUsers) {
    return res.status(200).json({ message: users, success: true });
  } else {
    return res
      .status(200)
      .json({ message: "Could not get users", success: false });
  }
};

module.exports = { getUsersByLanguage };
