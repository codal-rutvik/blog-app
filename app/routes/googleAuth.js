const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized access. Please log in." });
  }
};

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    try {
      const user = req.user;

      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.redirect(`/auth/google/success`);
    } catch (error) {
      console.error(error);
      res.redirect("/auth/google/failure");
    }
  }
);

// Define success route
router.get("/auth/google/success", isLoggedIn, (req, res) => {
  res.send(`Hello ${req?.user?.firstName} ${req?.user?.lastName}!`);
});

module.exports = router;
