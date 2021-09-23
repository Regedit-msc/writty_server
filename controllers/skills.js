const { getAllUsers } = require("../utils/user_utils");

const getUsersBySkills = async (req, res, next) => {
  const { skill } = req.query;
  const { foundUsers, users } = await getAllUsers({ userSkills: skill });
  if (foundUsers) {
    return res.status(200).json({ message: users, success: true });
  } else {
    return res
      .status(200)
      .json({ message: "Could not get users", success: false });
  }
};

module.exports = { getUsersBySkills };
