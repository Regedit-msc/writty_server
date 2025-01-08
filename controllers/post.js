const Activity = require("../models/Activity");
const Feed = require("../models/Feed");
const { clearHash } = require("../utils/cache");
const { findUser } = require("../utils/user_utils");
const { imagekit } = require("../utils/imageKit");
const Post = require("../models/Post");

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
const createPost = async (req, res, next) => {
  const { username: userId } = req.locals;
  const { user, found } = await findUser({ _id: userId });

  const { image, tags, body } = req.body;
  if (!image) {
    const post = await Post.create({
      user: userId,
      tags,
      body,
    });

    const newFeedItems = [
      {
        user: userId,
        type: "post",
        postId: post._id,
      },
      ...user?.followers.map((follower) => {
        clearHash(follower.user);
        return {
          user: follower.user,
          type: "post",
          postId: post._id,
        };
      }),
    ];
    await Activity.create({
      user: userId,
      postId: post._id,
      type: "post",
    });
    await Feed.insertMany(newFeedItems);
    return res.status(200).json({ message: "Post created", success: true });
  }
  const data = await doUpload(image.b64, image.type);
  if (data.err) {
    return res.status(200).json({
      message: "Error uploading image, Post not created.",
      success: false,
    });
  }
  const post = await Post.create({
    user: userId,
    imageUrl: data.result.url,
    tags,
    body,
  });

  const newFeedItems = [
    {
      user: userId,
      type: "post",
      postId: post._id,
    },
    ...user?.followers.map((follower) => {
      clearHash(follower.user);
      return {
        user: follower.user,
        type: "post",
        postId: post._id,
      };
    }),
  ];
  await Activity.create({
    user: userId,
    postId: post._id,
    type: "post",
  });
  await Feed.insertMany(newFeedItems);
  return res.status(200).json({ message: "Post created", success: true });
};
module.exports = { createPost };
