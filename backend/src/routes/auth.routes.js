const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { authLimiter } = require("../middleware/rateLimiter.middleware");
const { registerSchema, loginSchema } = require("../validators/auth.validator");

// POST /api/auth/register
router.post("/register", authLimiter, validate(registerSchema), authController.register);

// POST /api/auth/login
router.post("/login", authLimiter, validate(loginSchema), authController.login);

// POST /api/auth/logout
router.post("/logout", authController.logout);

// GET /api/auth/me
router.get("/me", authMiddleware, authController.getMe);

module.exports = router;
