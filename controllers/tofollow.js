const paginatedToFollow = async (req, res, next) => {
  res.status(200).json({ message: res.paginatedResults, success: true });
};

module.exports = { paginatedToFollow };
