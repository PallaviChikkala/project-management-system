const { rateLimit } = require("express-rate-limit");

// Rate limiter for authentication endpoints: max 50 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication requests from this IP. Please try again after 15 minutes.",
  },
});

module.exports = {
  authLimiter,
};
