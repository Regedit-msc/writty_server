const Activity = require("../models/Activity");
const Feed = require("../models/Feed");
const Question = require("../models/Question");
const { clearHash } = require("../utils/cache");
const { findUser } = require("../utils/user_utils");
const { imagekit } = require("../utils/imageKit");

const doUpload = (b64, imageType) => {
  return new Promise((resolve, reject) => {
    imagekit.upload(
      {
        file: b64,
        fileName: `live_gists_question.${imageType}`,
      },
      (error, result) =>
        !error
          ? resolve({ result, err: null })
          : reject({ result: null, err: error })
    );
  });
};
const createQuestion = async (req, res, next) => {
  const { username: userId } = req.locals;
  const { user, found } = await findUser({ _id: userId });

  const { question: theQuestion, referenceImages, tags } = req.body;

  if (referenceImages && referenceImages.length > 0) {
    const imageUrls = [];
    for (let i = 0; i < referenceImages.length; i++) {
      const data = await doUpload(
        referenceImages[i].b64,
        referenceImages[i].type
      );
      if (data.err) {
        return res.status(200).json({
          message: "Error uploading images, Question not created.",
          success: false,
        });
      } else {
        imageUrls.push(data.result.url);
      }
    }
    const question = await Question.create({
      user: userId,
      question: theQuestion,
      imageUrls,
      tags,
    });
    const newFeedItems = [
      {
        user: userId,
        type: "question",
        questionId: question._id,
      },
      ...user?.followers.map((follower) => {
        clearHash(follower.user);
        return {
          user: follower.user,
          type: "question",
          questionId: question._id,
        };
      }),
    ];
    await Activity.create({
      user: userId,
      questionId: question._id,
      type: "question",
    });
    await Feed.insertMany(newFeedItems);
    return res.status(200).json({ message: "Question created", success: true });
  }

  const question1 = await Question.create({
    question: theQuestion,
    user: userId,
    tags,
  });
  if (found) {
    const newFeedItems = [
      {
        user: userId,
        type: "question",
        questionId: question1._id,
      },
      ...user?.followers.map((follower) => {
        clearHash(follower.user);
        return {
          user: follower.user,
          type: "question",
          questionId: question1._id,
        };
      }),
    ];
    await Feed.insertMany(newFeedItems);
    await Activity.create({
      user: userId, // Your id
      type: "question",
      questionId: question1._id,
    });
  }
  if (question1)
    return res
      .status(200)
      .json({ message: "Qusestion successfully created", success: true });
};
module.exports = { createQuestion };
