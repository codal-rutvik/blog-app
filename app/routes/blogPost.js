const express = require("express");
const router = express.Router();
const blogPostController = require("../controllers/blogPostController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("", blogPostController.getBlogPosts);
router.get("/:id", blogPostController.getBlogPosts);
router.post("", authMiddleware, blogPostController.createBlogPost);
router.put("/:id", authMiddleware, blogPostController.updateBlogPost);
router.delete("/:id", authMiddleware, blogPostController.deleteBlogPost);
router.post(
  "/:id/favorite",
  authMiddleware,
  blogPostController.favoriteBlogPost
);
router.post("/:id/like", authMiddleware, blogPostController.likeBlogPost);

module.exports = router;
