const mongoose = require("mongoose");

// Connect to MongoDB using the provided URI
console.log("process.env.MONGODB_URI", process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", (err) => {
  console.error(`MongoDB connection error: ${err}`);
});

db.once("open", () => {
  console.log("Connected to MongoDB..");
});

module.exports = db;
