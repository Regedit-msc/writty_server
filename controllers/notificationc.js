const { updateUser } = require("../utils/user_utils");

const notificationc = async (req, res) => {
    const { username } = req.locals;
    const subscription = req.body
    await updateUser({ _id: username }, { sub: subscription });
    res.status(200).json({ message: "Subscripton added", success: true })
};

module.exports = { notificationc }