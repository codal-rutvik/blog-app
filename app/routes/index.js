const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const blogPostRoutes = require("./blogPost");
const userRoutes = require("./user");

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/blog", blogPostRoutes);

module.exports = router;
