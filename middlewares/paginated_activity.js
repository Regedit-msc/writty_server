const Activity = require("../models/Activity");
const { findUser } = require("../utils/user_utils");

async function paginateActivity(req, res, next) {
  const { username } = req.query;
  const { user } = await findUser({ username });
  const activities = await Activity.find({ user: user._id });
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results = {};
  if (endIndex < (await activities.length)) {
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
    results.results = await Activity.find({ user: user._id })
      .limit(limit)
      .skip(startIndex)
      .populate([
        {
          path: "user",
          select: "username profileImageUrl about userSkills",
        },
        {
          path: "docId",
        },
        {
          path: "snippetId",
        },
        {
          path: "questionId",
        },
        {
          path: "followedId",
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
      .json({ message: "Could not get activity.", success: false });
  }
}
module.exports = { paginateActivity };
