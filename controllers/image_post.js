const Activity = require("../models/Activity");
const Feed = require("../models/Feed");
const { clearHash } = require("../utils/cache");
const { findUser } = require("../utils/user_utils");
const { imagekit } = require("../utils/imageKit");
const ImagePost = require("../models/ImagePost");

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
const createImagePost = async (req, res, next) => {
  const { username: userId } = req.locals;
  const { user, found } = await findUser({ _id: userId });

  const { image, tags } = req.body;
  const data = await doUpload(image.b64, image.type);
  if (data.err) {
    return res.status(200).json({
      message: "Error uploading image, Image Post not created.",
      success: false,
    });
  }
  const imagePost = await ImagePost.create({
    user: userId,
    imageUrl: data.result.url,
    tags,
  });

  const newFeedItems = [
    {
      user: userId,
      type: "image_post",
      imagePostId: imagePost._id,
    },
    ...user?.followers.map((follower) => {
      clearHash(follower.user);
      return {
        user: follower.user,
        type: "image_post",
        imagePostId: imagePost._id,
      };
    }),
  ];
  await Activity.create({
    user: userId,
    imagePostId: imagePost._id,
    type: "image_post",
  });
  await Feed.insertMany(newFeedItems);
  return res.status(200).json({ message: "Image Post created", success: true });
};
module.exports = { createImagePost };
