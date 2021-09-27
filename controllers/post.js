const Activity = require("../models/Activity");
const Feed = require("../models/Feed");
const Post = require("../models/Post");
const { clearHash } = require("../utils/cache");
const { imagekit } = require("../utils/imageKit");
const { findUser } = require("../utils/user_utils");

const createPost = async (req, res, next) => {
  const { username: userId } = req.locals;
  const { body, image } = req.body;
  const { user, found } = await findUser({ _id: userId });

  if (image) {
    imagekit.upload(
      {
        file: image.b64, //required
        fileName: `post_image_live_gists.${image.type}`, //required
      },
      async function (error, result) {
        if (error) console.log(error);
        else {
          if (found) {
            const post = await Post.create({
              body,
              image: result.url,
              user: userId,
            });
            const newFeedItems = user?.followers.map((follower) => {
              clearHash(follower.user);
              return {
                user: follower.user,
                type: "post",
                postId: post._id,
              };
            });
            await Feed.insertMany(newFeedItems);
            await Activity.create({
              user: userId, // Your id
              type: "post",
              postId: post._id,
            });
            if (post)
              return res.status(200).json({
                message: "Post successfully created",
                success: true,
              });
          }
        }
      }
    );
  } else {
    const post = await Post.create({
      body,
      user: userId,
    });
    const newFeedItems = user?.followers.map((follower) => {
      clearHash(follower.user);
      return {
        user: follower.user,
        type: "post",
        postId: post._id,
      };
    });
    await Feed.insertMany(newFeedItems);
    await Activity.create({
      user: userId, // Your id
      type: "post",
      postId: post._id,
    });
    if (post)
      return res.status(200).json({
        message: "Post successfully created",
        success: true,
      });
  }
};
module.exports = { createPost };
