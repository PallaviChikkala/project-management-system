const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const authMiddleware = require("../middleware/auth.middleware");

// All dashboard routes require authentication
router.use(authMiddleware);

// GET /api/dashboard
router.get("/", dashboardController.getDashboardStats);

module.exports = router;
