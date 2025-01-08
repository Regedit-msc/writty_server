const { getAllUsers } = require("../utils/user_utils");

const getUsersByBadge = async (req, res, next) => {
  const { bagde } = req.query;
  const { foundUsers, users } = await getAllUsers({ badges: bagde });
  if (foundUsers) {
    return res.status(200).json({ message: users, success: true });
  } else {
    return res
      .status(200)
      .json({ message: "Could not get users", success: false });
  }
};

module.exports = { getUsersByBadge };
