const express = require("express");
const router = express.Router();
const commenController = require("../controllers/commentController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/:blogId/comment", authMiddleware, commenController.getAllComments);
router.post("/:blogId/comment", authMiddleware, commenController.createComment);
router.put(
  "/:blogId/comment/:commentId",
  authMiddleware,
  commenController.updateComment
);
router.delete(
  "/:blogId/comment/:commentId",
  authMiddleware,
  commenController.deleteComment
);
router.post(
  "/:blogId/comment/:commentId/like",
  authMiddleware,
  commenController.likeComment
);

module.exports = router;
