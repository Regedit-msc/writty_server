const { clearHash } = require("../utils/cache");
const { findNotifications } = require("../utils/notification_utils");
const { updateUser } = require("../utils/user_utils");

const notificationc = async (req, res) => {
  const { username } = req.locals;
  const subscription = req.body;
  const { user } = await updateUser({ _id: username }, { sub: subscription });
  clearHash(user._id);
  res.status(200).json({ message: "Subscripton added", success: true });
};

const notificationsGet = async (req, res, next) => {
  const { username } = req.locals;
  const { notifications, found } = await findNotifications({ user: username });
  if (found) {
    res.status(200).json({ message: notifications, success: true });
  } else {
    res.status(200).json({ message: "Not found", success: false });
  }
};
const paginatedNotifications = async (req, res, next) => {
  res.status(200).json({ message: res.paginatedResults, success: true });
};

module.exports = { notificationc, notificationsGet, paginatedNotifications };
