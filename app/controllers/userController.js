const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");

const signup = async (req, res) => {
  const { firstName, lastName, phoneNumber, email, password } = req.body;

  // Define a schema for data validation
  const schema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    phoneNumber: Joi.string().regex(/^\d+$/), // Ensure only digits are allowed
    email: Joi.string().email(),
    password: Joi.string().min(6),
  });

  try {
    // Validate user input against the schema
    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error?.details[0]?.message });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create a new user
    const newUser = new User({
      firstName,
      lastName,
      phoneNumber,
      email,
      password,
    });

    // Save the user to the database
    await newUser.save();

    res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during signup" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  // Define a schema for data validation
  const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  try {
    // Validate user input against the schema
    const { error } = loginSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    // Check if the user exists
    if (!user) {
      return res
        .status(401)
        .json({ error: "Invalid credentials, User Not Found!" });
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create a JWT token with user data and expiration (1 day)
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Store the token in the user document if needed
    user.token = token;
    await user.save();

    // Return the token in the response
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "An error occurred during login" });
  }
};

async function getUserProfile(req, res) {
  const userData = req.user; // Get the user's Data from the authenticated token

  try {
    // Fetch the user's complete profile using the userId
    const user = await User.findById(userData?.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the complete user profile
    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the user profile" });
  }
}

async function updateUserProfile(req, res) {
  const userData = req.user;

  // Extract updated profile data from the request body
  const { firstName, lastName, phoneNumber, email } = req.body;

  const schema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    phoneNumber: Joi.string().regex(/^\d+$/), // Ensure only digits are allowed
    email: Joi.string().email(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
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
    if (email) user.email = email;

    // Save the updated user profile
    await user.save();

    const updatedUser = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      email: user.email,
    };

    res
      .status(200)
      .json({ message: "User profile updated successfully", updatedUser });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the user profile" });
  }
}

module.exports = { signup, login, getUserProfile, updateUserProfile };
