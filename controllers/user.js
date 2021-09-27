const {
  findUser,
  updateUser,
  getAllUsersByName,
} = require("../utils/user_utils");
const _ = require("lodash");
const { getAllDocsByUsers } = require("../utils/doc_utils");
const { imagekit } = require("../utils/imageKit");
const { createNotification } = require("../utils/notification_utils");
const webPush = require("../utils/push_utils/index");
const sharp = require("sharp");
const { userModel } = require("../utils/cron_job");
const { clearHash } = require("../utils/cache");
const Feed = require("../models/Feed");
const Activity = require("../models/Activity");
const details = async (req, res, next) => {
  const { username } = req.locals;
  const { found, user } = await findUser({ _id: username });
  if (found) {
    const { foundDocs, docs } = await getAllDocsByUsers({ user: username });

    if (foundDocs)
      return res.status(200).json({
        message: docs,
        username: user.username,
        success: true,
        image: user.profileImageUrl,
        uid: user._id,
      });
  }
  res.status(200).json({ message: "No details found", success: false });
};

const userDetailsShort = async (req, res, next) => {
  const { username } = req.locals;
  const { user } = await findUser({ _id: username });
  res.status(200).json({
    message: _.pick(user, ["profileImageUrl", "username", "_id"]),
    success: true,
  });
};

const profileImage = async (req, res, next) => {
  const { username } = req.locals;
  const { b64, type } = req.body;
  const base64Image = `data:image/${type};base64,${b64}`;
  let parts = base64Image.split(";");
  let imageData = parts[1].split(",")[1];
  var img = Buffer.from(imageData, "base64");
  sharp(img)
    .resize(460, 460)
    .webp({ lossless: true })
    .toBuffer()
    .then((resizedImageBuffer) => {
      let resizedImageData = resizedImageBuffer.toString("base64");
      imagekit.upload(
        {
          file: resizedImageData,
          fileName: `profile_image_from_live_gists.webp`,
        },
        async function (error, result) {
          if (error) return console.log(error);
          await updateUser({ _id: username }, { profileImageUrl: result.url });
          res.status(200).json({ message: result?.url ?? "", success: true });
        }
      );
    })
    .catch((error) => {
      res
        .status(200)
        .json({ message: "Error uploading image", success: false });
    });
};

const searchUsers = async (req, res, next) => {
  console.log("Started");
  if (!req.locals?.username)
    return res.status(200).json({ message: "Not allowed", success: false });
  const { wol } = req.query;
  const usersFromSearchDB = await userModel.collection
    .find({
      username: {
        $regex: new RegExp(wol.replace(/^"(.*)"$/, "$1")),
        $options: "i",
      },
    })
    .toArray();
  if (usersFromSearchDB) {
    res.status(200).json({ message: usersFromSearchDB, success: true });
  }
};
const onboardUser = async (req, res, next) => {
  if (!req.locals?.username)
    return res.status(200).json({ message: "Not allowed", success: false });
  const { details } = req.body;
  const base64Image = `data:image/${details.image.type};base64,${details.image.b64}`;
  let parts = base64Image.split(";");
  let imageData = parts[1].split(",")[1];
  var img = Buffer.from(imageData, "base64");
  sharp(img)
    .resize(460, 460)
    .webp({ lossless: true })
    .toBuffer()
    .then((resizedImageBuffer) => {
      let resizedImageData = resizedImageBuffer.toString("base64");
      imagekit.upload(
        {
          file: resizedImageData,
          fileName: `profile_image_from_live_gists.webp`,
        },
        async function (error, result) {
          if (error) return console.log(error);
          const {} = await updateUser(
            { _id: req.locals.username },
            {
              isVerified: true,
              userLanguages: details.userLanguages,
              userSkills: details.userSkills,
              about: details.about,
              profileImageUrl: result.url,
              finishedProfileUpdate: true,
              experience: details.experienceAndWorks,
            }
          );
          clearHash(req.locals.username);
          res.status(200).json({
            message: "Successfully finished profile update",
            success: true,
          });
        }
      );
    })
    .catch((error) => {
      res
        .status(200)
        .json({ message: "Error uploading image", success: false });
    });
};

const follow = async (req, res, next) => {
  const { username: userId } = req.locals;
  const { followId } = req.body;
  const { found: followUserFound, user: followUser } = await findUser({
    _id: userId,
  });
  if (!followUserFound)
    return res.status(200).json({ message: "Not Found", success: false });
  const { user } = await findUser({ _id: followId });
  const userFollowers = user?.followers;
  const alreadyFollowed = userFollowers.findIndex((e) => e.user == userId);
  console.log(alreadyFollowed);
  if (alreadyFollowed === -1) {
    const { updated } = await updateUser(
      { _id: user._id },
      { followers: [...user.followers, { user: userId }] }
    );

    clearHash(followId);
    const payload = JSON.stringify({
      title: "New Follower",
      body: `${followUser.username} followed you.`,
      image: followUser.profileImageUrl,
    });
    webPush
      .sendNotification(user.sub, payload)
      .then((result) => console.log(result))
      .catch((e) => console.log("Push failed"));

    await createNotification(
      user._id,
      `${`${followUser.username} followed you.`}`,
      userId
    );
    const newFeedItems = userFollowers.map((follower) => {
      clearHash(follower.user);
      return {
        user: follower.user,
        type: "follow",
        followedId: user._id,
      };
    });
    await Feed.insertMany(newFeedItems);
    await Activity.create({
      user: userId, // Your id
      type: "follow",
      followedId: user._id,
    });
    if (updated)
      return res.status(200).json({ message: "Followed.", success: true });
  } else {
    const { updated } = await updateUser(
      { _id: followId },
      { followers: [...user.followers.filter((e) => e.user != userId)] }
    );
    clearHash(followId);
    if (updated)
      return res.status(200).json({ message: "Unfollowed.", success: true });
  }
};
module.exports = {
  details,
  userDetailsShort,
  profileImage,
  searchUsers,
  onboardUser,
  follow,
};
