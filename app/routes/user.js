const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, userController.getUserProfile);
router.put("/", authMiddleware, userController.updateUserProfile);
router.get("/favorite", authMiddleware, userController.getUserFavoriteBlogs);

module.exports = router;
