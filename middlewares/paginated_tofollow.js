const ToFollow = require("../models/ToFollow");
const { findUser } = require("../utils/user_utils");

async function paginateToFollow(req, res, next) {
  const { username: userId } = req.locals;
  const { user } = await findUser({ _id: userId });
  const tofollow = await ToFollow.find({ user: user._id });
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results = {};
  if (endIndex < tofollow.length) {
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
    results.results = await ToFollow.find({ user: user._id })
      .limit(limit)
      .skip(startIndex)
      .populate([
        {
          path: "user",
          select: "username profileImageUrl about userSkills",
        },
        {
          path: "userToFollow",
          select: "username profileImageUrl about userSkills followers",
        },
        {
          path: "reference",
          select: "username profileImageUrl about userSkills",
        },
      ])
      .sort({ createdAt: "desc" })
      .lean()
      .exec();
    res.paginatedResults = results;
    next();
  } catch (e) {
    console.log(e);
    res
      .status(200)
      .json({ message: "Could not get tofollow.", success: false });
  }
}
module.exports = { paginateToFollow };
