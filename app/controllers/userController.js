const User = require("../models/user");
const Blog = require("../models/blogPost");
const Joi = require("joi");
const mongoose = require("mongoose");
const { validateData } = require("../common/joiValidator");

const getUserProfile = async (req, res, next) => {
  const userData = req.user; // Get the user's Data from the authenticated token

  try {
    // Fetch the user's complete profile using the userId
    const user = await User.findById(userData?.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, __v, ...userProfileData } = user.toObject();

    // Return the complete user profile
    res.status(200).json({ data: userProfileData });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  const { role, userId } = req.user;
  const { id } = req.params;

  // Extract updated profile data from the request body
  const { firstName, lastName, phoneNumber, email } = req.body;

  const schema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    phoneNumber: Joi.string()
      .regex(/^\+?[0-9. ()-]{10,}$/)
      .message("Invalid phone number"),
    email: Joi.string().email(),
  });

  const validatedData = validateData(req.body, schema);

  if (typeof validatedData === "string") {
    return res.status(400).json({ error: validatedData });
  }

  // Check if at least one field is provided in the request body
  if (!firstName && !lastName && !phoneNumber && !email) {
    return res
      .status(400)
      .json({ error: "At least one field is required for the profile update" });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: "Invalid userId. Please provide a valid user identifier.",
    });
  }

  try {
    // Fetch the user's current profile
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the logged-in user is an admin or the owner of the profile
    if (role !== "admin" && userId !== id) {
      return res.status(403).json({
        error: "Permission denied. You do not have the necessary permissions.",
      });
    }

    // Update the user's profile data
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (email) user.email = email.toLowerCase();

    // Save the updated user profile
    await user.save();

    const updatedUser = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      email: user.email,
    };

    res.status(200).json({
      message: "User profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const getUserFavoriteBlogs = async (req, res, next) => {
  const { userId } = req.user;
  try {
    // Find the user's favorite blogs
    const favoriteBlogs = await Blog.find({
      favorites: userId,
      status: "published",
    }).select("-favorites -__v");

    if (favoriteBlogs.length === 0) {
      return res.status(404).json({ message: "No favorite blog posts found" });
    }

    res.status(200).json({ data: favoriteBlogs });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Permission denied. Admin role required." });
    }

    const users = await User.find(
      { role: { $ne: "admin" } },
      { password: 0, __v: 0 }
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }

    res.status(200).json({ data: users });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserFavoriteBlogs,
  getAllUsers,
};
