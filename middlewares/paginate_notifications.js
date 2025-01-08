const Notification = require("../models/Notification");

async function paginateNotifications(req, res, next) {
  const { username } = req.locals;
  const notifications = await Notification.find({ user: username });
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results = {};
  if (endIndex < (await notifications.length)) {
    results.next = {
      page: page + 1,
      limit: limit,
    };
  }

  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit: limit,
    };
  }
  try {
    results.results = await Notification.find({ user: username })
      .limit(limit)
      .skip(startIndex)
      .populate([
        {
          path: "user",
          select: "username profileImageUrl about userSkills",
        },
        {
          path: "from",
          select: "username profileImageUrl about userSkills",
        },
      ])
      .sort({ createdAt: "desc" })
      .lean()
      .exec();
    res.paginatedResults = results;

    next();
  } catch (e) {
    res
      .status(200)
      .json({ message: "Could not get notifications.", success: false });
  }
}
module.exports = { paginateNotifications };
