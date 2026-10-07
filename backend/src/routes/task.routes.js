const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task.controller");
const authMiddleware = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
  createTaskSchema,
  updateTaskSchema,
} = require("../validators/task.validator");

// All task routes require authentication
router.use(authMiddleware);

// GET /api/tasks
router.get("/", taskController.getTasks);

// GET /api/tasks/:id
router.get("/:id", taskController.getTaskById);

// POST /api/tasks
router.post("/", validate(createTaskSchema), taskController.createTask);

// PUT /api/tasks/:id
router.put("/:id", validate(updateTaskSchema), taskController.updateTask);

// DELETE /api/tasks/:id
router.delete("/:id", taskController.deleteTask);

module.exports = router;
