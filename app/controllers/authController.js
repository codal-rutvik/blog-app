const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { validateData } = require("../common/joiValidator");

const signup = async (req, res, next) => {
  const { firstName, lastName, phoneNumber, email, password } = req.body;

  // Define a schema for data validation
  const schema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phoneNumber: Joi.string().regex(/^\d+$/), // Ensure only digits are allowed
    email: Joi.string().email(),
    password: Joi.string().min(6),
  });

  try {
    const validatedData = validateData(req.body, schema);

    if (typeof validatedData === "string") {
      return res.status(400).json({ error: validatedData });
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
    next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  // Define a schema for data validation
  const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  try {
    const validatedData = validateData(req.body, loginSchema);

    if (typeof validatedData === "string") {
      return res.status(400).json({ error: validatedData });
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
    next(error);
  }
};

module.exports = { signup, login };
