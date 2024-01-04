require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const routes = require("./app/routes");
const db = require("./app/config/db");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const ErrorHandler = require("./app/middleware/errorMiddleware");
const googleAuthRoutes = require("./app/routes/googleAuth");
require("./app/middleware/googleAuthMiddleware");

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "app/client/index.html");
  res.sendFile(indexPath);
});

app.use("/", googleAuthRoutes);
app.use("/api", routes);

app.use("/uploads", express.static("uploads"));
app.use(ErrorHandler);
// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
