require("dotenv").config();
const express = require("express");
const app = express();
const routes = require("./app/routes");
const db = require("./app/config/db");
const ErrorHandler = require("./app/middleware/errorMiddleware");

app.use(express.json());

app.use("/api", routes);
app.use("/uploads", express.static("uploads"));
app.use(ErrorHandler);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
