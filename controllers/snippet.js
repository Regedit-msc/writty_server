const Activity = require("../models/Activity");
const Feed = require("../models/Feed");
const Snippet = require("../models/Snippet");
const { clearHash } = require("../utils/cache");
const { findUser } = require("../utils/user_utils");

const createSnippet = async (req, res, next) => {
  const { username: userId } = req.locals;
  const { user, found } = await findUser({ _id: userId });
  const snippet = await Snippet.create({ ...req.body, user: userId });
  if (found) {
    const newFeedItems = user?.followers.map((follower) => {
      clearHash(follower.user);
      return {
        user: follower.user,
        type: "snippet",
        snippetId: snippet._id,
      };
    });
    await Feed.insertMany(newFeedItems);
    await Activity.create({
      user: userId, // Your id
      type: "snippet",
      snippetId: snippet._id,
    });
  }
  if (snippet)
    return res
      .status(200)
      .json({ message: "Snippet successfully created", success: true });
};
module.exports = { createSnippet };
