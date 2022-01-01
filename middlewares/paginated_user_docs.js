const Doc = require("../models/Document");
const { getAllDocsByUsers } = require("../utils/doc_utils");
const { findUser } = require("../utils/user_utils");

const paginateUserDocs = async (req, res, next) => {
  const { username } = req.query;

  const { found, user } = await findUser({ username: username });

  const { docs } = await getAllDocsByUsers({ user: user._id, private: false });
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results = {};
  if (endIndex < docs.length) {
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
    results.results = await Doc.find({ user: user._id, private: false })
      .limit(limit)
      .skip(startIndex)
      .populate([
        {
          path: "user",
          select: "username profileImageUrl about userSkills",
        },
      ])
      .select(
        "name user language private publicLink collabLink data theme comments createdAt likes"
      )
      .sort({ createdAt: "desc" })
      .lean()
      .exec();
    res.paginatedResults = results;

    next();
  } catch (e) {
    res.status(200).json({ message: "Could not get docs.", success: false });
  }
};

module.exports = { paginateUserDocs };
