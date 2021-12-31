const { findDoc, updateDoc } = require("../utils/doc_utils");
const { createNotification } = require("../utils/notification_utils");
const { findUser } = require("../utils/user_utils");
const webPush = require("../utils/push_utils/index");
const Activity = require("../models/Activity");

const like = async (req, res, next) => {
  const { username } = req.locals;
  const { publicLink } = req.body;
  const { user } = await findUser({ _id: username });
  const { doc } = await findDoc({ publicLink });
  const userFollowers = user?.followers;
  const alreadyLiked = doc?.likes.findIndex((e) => e.user == username);
  function doCheck(id) {
    if (doc.user._id == id) return true;
    return false;
  }

  if (alreadyLiked === -1) {
    const { updated } = await updateDoc(
      { _id: doc._id },
      { likes: [...doc.likes, { user: username }] }
    );
    const payload = JSON.stringify({
      title: "Like",
      body: `${
        doCheck(username) ? "You" : user.username
      } reacted to your gist.`,
      image: user.profileImageUrl,
    });
    webPush
      .sendNotification(doc.user.sub, payload)
      .then((result) => console.log(result))
      .catch((e) => console.log("Push failed"));

    await createNotification(
      doc.user._id,
      `${doCheck(username) ? "You" : user.username} reacted to your gist.`,
      username
    );
    const newFeedItems = userFollowers.map((follower) => {
      clearHash(follower.user); // Clear user cached data
      return {
        user: follower.user, // Your follower
        type: "likeddoc",
        whoLikedId: username, // Current session user
        docId: doc._id, // Current session doc
      };
    });
    const toFollow = userFollowers.map((follower) => {
      clearHash(follower.user);
      return {
        user: follower.user,
        userToFollow: doc.user._id,
        reference: username,
      };
    });
    await ToFollow.insertMany(toFollow);
    await Feed.insertMany(newFeedItems);
    await Activity.create({
      user: username, // Your id
      type: "likeddoc",
      docId: doc._id,
    });
    if (updated)
      return res.status(200).json({ message: "Liked code.", success: true });
  } else {
    const { updated } = await updateDoc(
      { _id: doc._id },
      { likes: [...doc.likes.filter((e) => e.user != username)] }
    );
    if (updated)
      return res.status(200).json({ message: "Unliked code.", success: true });
  }
};

module.exports = { like };
