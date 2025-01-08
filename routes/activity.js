const { paginatedActivityC } = require("../controllers/activity");
const { paginateActivity } = require("../middlewares/paginated_activity");

const router = require("express").Router();
const path = "/";
router.get("/activity", paginateActivity, paginatedActivityC);

module.exports = { router, path };
