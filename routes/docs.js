const {
  detailsPublic,
  paginatedPub,
  pubDocs,
  createDocument,
  searchDocs,
  deleteDocument,
  updateVisibility,
  createCollab,
  deleteCollab,
  getComments,
  getCode,
  createComment,
  getCodeWithName,
} = require("../controllers/docs");
const isUserVerified = require("../middlewares/verify_user");
const cleanCache = require("../utils/cleanCache");
const { extractJWT } = require("../utils/jwt");
const { paginatedDocs } = require("../utils/paginateDocs");

const router = require("express").Router();
const path = "/";
router.get("/details/public", detailsPublic);
router.get(
  "/public/docs/paginated",
  paginatedDocs({ private: false }),
  paginatedPub
);
router.get("/public/docs", pubDocs);
router.post("/create/doc", cleanCache, extractJWT, createDocument);
router.get("/search/docs", searchDocs);
router.post(
  "/delete/doc",
  cleanCache,
  extractJWT,
  isUserVerified,
  deleteDocument
);
router.post(
  "/update/visibility/doc",
  cleanCache,
  extractJWT,
  isUserVerified,
  updateVisibility
);
router.post(
  "/create/collab",
  cleanCache,
  extractJWT,
  isUserVerified,
  createCollab
);
router.post(
  "/delete/collab",
  cleanCache,
  extractJWT,
  isUserVerified,
  deleteCollab
);
router.get("/get/comments", getComments);
router.get("/get/code", getCode);
router.get("/get/code", getCodeWithName);
router.post(
  "/create/comment",
  cleanCache,
  extractJWT,
  isUserVerified,
  createComment
);

module.exports = { router, path };
