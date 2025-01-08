const ImagePost = require("../models/ImagePost");
const Post = require("../models/Post");
const Question = require("../models/Question");

async function paginateTags(req, res, next) {
  const { tag } = req.query;
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const questionsMatchingTag = await Question.find({ tags: tag })
    .limit(limit)
    .skip(startIndex)
    .populate("user");
  const postsMatchingTag = await Post.find({ tags: tag })
    .limit(limit)
    .skip(startIndex)
    .populate("user");
  const imagePostMatchingTag = await ImagePost.find({ tags: tag })
    .limit(limit)
    .skip(startIndex)
    .populate("user");

  const results = {};
  if (
    endIndex <
    questionsMatchingTag.length +
      postsMatchingTag.length +
      imagePostMatchingTag.length
  ) {
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
    results.results = [
      ...postsMatchingTag,
      ...questionsMatchingTag,
      ...imagePostMatchingTag,
    ];
    res.paginatedResults = results;

    next();
  } catch (e) {
    res.status(200).json({ message: "Could not get tags.", success: false });
  }
}
module.exports = { paginateTags };
