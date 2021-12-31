const Feed = require("../models/Feed");

async function paginateFeed(req, res, next) {
  const { username: userId } = req.locals;
  const feeds = await Feed.find({ user: userId });
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results = {};
  if (endIndex < (await feeds.length)) {
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
    results.results = await Feed.find({ user: userId })
      .limit(limit)
      .skip(startIndex)
      .populate([
        {
          path: "user",
          select: "username profileImageUrl about userSkills",
        },
        {
          path: "postId",
          populate: {
            path: "user",
            model: "user",
            select: "username profileImageUrl about userSkills",
          },
        },
        {
          path: "docId",
        },
        {
          path: "snippetId",

          populate: {
            path: "user",
            model: "user",
            select: "username profileImageUrl about userSkills",
          },
        },
        {
          path: "questionId",
          populate: {
            path: "user",
            model: "user",
            select: "username profileImageUrl about userSkills",
          },
        },
        {
          path: "imagePostId",
          populate: {
            path: "user",
            model: "user",
            select: "username profileImageUrl about userSkills",
          },
        },
        {
          path: "followedId",
          select: "username profileImageUrl about userSkills",
        },
        {
          path: "whoFollowedId",
          select: "username profileImageUrl about userSkills",
        },
        {
          path: "whoLikedId",
          select: "username profileImageUrl about userSkills",
        },
      ])
      .sort({ createdAt: "desc" })
      .lean()
      .exec();
    res.paginatedResults = results;
    next();
  } catch (e) {
    res.status(200).json({ message: "Could not get feed.", success: false });
  }
}
module.exports = { paginateFeed };
//TODO: Add to feed route
