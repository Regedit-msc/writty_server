const User = require("../models/User");
const { clearHash } = require("../utils/cache");
const { findUser } = require("../utils/user_utils");

async function paginateFollow(req, res, next) {
  const { username: userId } = req.locals;
  clearHash(userId);
  const { user } = await findUser({ _id: userId });
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const results = {};
  if (endIndex < (await user?.followers.length)) {
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
  const userD = await User.findOne({ _id: userId })
    .limit(limit)
    .skip(startIndex)
    .populate([
      {
        path: "followers.user",
        select: "username profileImageUrl about userSkills",
      },
    ])
    .sort({ createdAt: "desc" })
    .lean()
    .exec();
  try {
    results.results = userD?.followers;
    console.log(results.results);
    res.paginatedResults = results;
    next();
  } catch (e) {
    console.log(e);
    res
      .status(200)
      .json({ message: "Could not get followers.", success: false });
  }
}
module.exports = { paginateFollow };
