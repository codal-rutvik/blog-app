const express = require("express");
const router = express.Router();
const blogPostController = require("../controllers/blogPostController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/posts", blogPostController.getBlogPosts);
router.post("/posts", authMiddleware, blogPostController.createBlogPost);
router.put("/posts/:id", authMiddleware, blogPostController.updateBlogPost);
router.post("/:blogId/like", authMiddleware, blogPostController.likeBlogPost);

module.exports = router;
