const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, userController.getUserProfile);
router.get("/all", authMiddleware, userController.getAllUsers);
router.put("/:id", authMiddleware, userController.updateUserProfile);
router.get("/favorite", authMiddleware, userController.getUserFavoriteBlogs);

module.exports = router;
