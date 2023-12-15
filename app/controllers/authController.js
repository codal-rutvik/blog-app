const User = require("../models/user");
const Token = require("../models/token");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { validateData } = require("../common/joiValidator");
const crypto = require("crypto");
const { sendEmail } = require("../common/sendEmail");

const signup = async (req, res, next) => {
  const { firstName, lastName, phoneNumber, email, password } = req.body;

  // Define a schema for data validation
  const schema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phoneNumber: Joi.string()
      .regex(/^\+?[0-9. ()-]{10,}$/)
      .message("Invalid phone number"),
    email: Joi.string().email(),
    password: Joi.string()
      .min(6)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .message(
        "Password must be at least 6 characters, include at least one uppercase letter, one numeric digit, and one special character."
      ),
  });

  try {
    const validatedData = validateData(req.body, schema);

    if (typeof validatedData === "string") {
      return res.status(400).json({ error: validatedData });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create a new user
    const newUser = new User({
      firstName,
      lastName,
      phoneNumber,
      email: email.toLowerCase(),
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
    const user = await User.findOne({ email: email.toLowerCase() });

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
      { userId: user._id, email: user.email, role: user.role },
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

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found with given mail" });
    }

    // Generate a unique token for password reset
    const resetToken = crypto.randomBytes(32).toString("hex");

    const token = new Token({
      userId: user._id,
      token: resetToken,
    });
    await token.save();

    const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
    const emailSubject = "Password Reset";
    const emailText = `Click the following link to reset your password: ${resetLink}`;
    await sendEmail(user.email, emailSubject, emailText);

    res
      .status(200)
      .json({ message: "Password reset link sent to your email account" });
  } catch (error) {
    console.error("Forgot password error:", error);
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const resetPasswordSchema = Joi.object({
      token: Joi.string().required(),
      newPassword: Joi.string()
        .min(6)
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
        )
        .message(
          "Password must be at least 6 characters, include at least one uppercase letter, one numeric digit, and one special character."
        ),
    });

    const validatedData = validateData(req.body, resetPasswordSchema);

    if (typeof validatedData === "string") {
      return res.status(400).json({ error: validatedData });
    }

    const resetToken = await Token.findOne({ token });

    if (!resetToken) {
      return res.status(404).json({ message: "Invalid or expired token" });
    }

    // Find the user associated with the reset token
    const user = await User.findById(resetToken.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's password
    user.password = newPassword;
    await user.save();

    // Remove the reset token from the database
    await Token.deleteOne({ token });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    next(error);
  }
};

module.exports = { signup, login, forgotPassword, resetPassword };
