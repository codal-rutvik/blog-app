const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Get the token from the request headers
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "Token not provided" });
  }

  try {
    // Verify the token without decoding it
    jwt.verify(token, process.env.JWT_SECRET);

    // If verification succeeds, you can decode the token to check for expiration
    const decoded = jwt.decode(token);

    // Check if the token is expired
    if (decoded && decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ error: "Token expired, please re-login" });
    }

    // Attach the decoded token to the request if needed
    req.user = decoded;

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = authMiddleware;
