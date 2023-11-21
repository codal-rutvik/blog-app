const express = require("express");
const router = express.Router();
const commenController = require("../controllers/commentController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/:blogId", authMiddleware, commenController.getAllComments);
router.post("/:blogId", authMiddleware, commenController.createComment);
router.put("/:id", authMiddleware, commenController.updateComment);
router.delete("/:id", authMiddleware, commenController.deleteComment);

module.exports = router;
