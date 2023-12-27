const express = require("express");
const passport = require("passport");
const router = express.Router();

const isLoggedIn = (req, res, next) => {
  req.user ? next() : res.sendStatus(401);
};

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/auth/google/success",
    failureRedirect: "/auth/google/failure",
  })
);

// Define success route
router.get("/auth/google/success", isLoggedIn, (req, res) => {
  res.send(`Hello ${req?.user?.firstName} ${req?.user?.lastName}!`);
});

module.exports = router;
