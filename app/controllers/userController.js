const User = require("../models/user");
const Blog = require("../models/blogPost");
const Joi = require("joi");
const { validateData } = require("../common/joiValidator");

const getUserProfile = async (req, res, next) => {
  const userData = req.user; // Get the user's Data from the authenticated token

  try {
    // Fetch the user's complete profile using the userId
    const user = await User.findById(userData?.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, ...userProfileData } = user.toObject();

    // Return the complete user profile
    res.status(200).json({ data: userProfileData });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  const userData = req.user;

  // Extract updated profile data from the request body
  const { firstName, lastName, phoneNumber, email } = req.body;

  const schema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    phoneNumber: Joi.string().regex(/^\d+$/), // Ensure only digits are allowed
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

  try {
    // Fetch the user's current profile
    const user = await User.findById(userData?.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
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

module.exports = { getUserProfile, updateUserProfile, getUserFavoriteBlogs };
