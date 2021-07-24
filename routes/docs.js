const { detailsPublic, paginatedPub, pubDocs, createDocument, searchDocs, deleteDocument, updateVisibility, createCollab, deleteCollab, getComments, getCode, createComment } = require("../controllers/docs");
const cleanCache = require("../utils/cleanCache");
const { extractJWT } = require("../utils/jwt");
const { paginatedDocs } = require("../utils/paginateDocs");

const router = require("express").Router();
const path = "/"
router.get("/details/public", detailsPublic);
router.get("/public/docs/paginated", paginatedDocs({ private: false }), paginatedPub);
router.get("/public/docs", pubDocs);
router.post("/create/doc", cleanCache, extractJWT, createDocument)
router.get("/search/docs", searchDocs);
router.post("/delete/doc", cleanCache, extractJWT, deleteDocument);
router.post("/update/visibility/doc", cleanCache, extractJWT, updateVisibility);
router.post("/create/collab", cleanCache, extractJWT, createCollab);
router.post("/delete/collab", extractJWT, cleanCache, deleteCollab);
router.get("/get/comments", getComments);
router.get("/get/code", getCode);
router.post("/create/comment", cleanCache, extractJWT, createComment)

module.exports = { router, path }