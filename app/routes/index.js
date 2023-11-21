const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const blogPostRoutes = require("./blogPost");
const userRoutes = require("./user");
const commentRoutes = require("./comment");

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/blog", blogPostRoutes);
router.use("/comments", commentRoutes);

module.exports = router;
