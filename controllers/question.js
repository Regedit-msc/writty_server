const Activity = require("../models/Activity");
const Feed = require("../models/Feed");
const Question = require("../models/Question");
const { clearHash } = require("../utils/cache");
const { findUser } = require("../utils/user_utils");

const createQuestion = async (req, res, next) => {
  const { username: userId } = req.locals;
  const { user, found } = await findUser({ _id: userId });
  const question = await Question.create({ ...req.body, user: userId });
  if (found) {
    const newFeedItems = user?.followers.map((follower) => {
      clearHash(follower.user);
      return {
        user: follower.user,
        type: "question",
        questionId: question._id,
      };
    });
    await Feed.insertMany(newFeedItems);
    await Activity.create({
      user: userId, // Your id
      type: "question",
      questionId: question._id,
    });
  }
  if (question)
    return res
      .status(200)
      .json({ message: "Qusestion successfully created", success: true });
};
module.exports = { createQuestion };
