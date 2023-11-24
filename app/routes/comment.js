const express = require("express");
const router = express.Router();
const commenController = require("../controllers/commentController");
const authMiddleware = require("../middleware/authMiddleware");

router.get(
  "/:blogId/comments",
  authMiddleware,
  commenController.getAllComments
);
router.post(
  "/:blogId/comments",
  authMiddleware,
  commenController.createComment
);
router.put(
  "/:blogId/comments/:id",
  authMiddleware,
  commenController.updateComment
);
router.delete(
  "/:blogId/comments/:id",
  authMiddleware,
  commenController.deleteComment
);
router.post(
  "/comments/:commentId/like",
  authMiddleware,
  commenController.likeComment
);

module.exports = router;
