const express = require("express");
const router = express.Router();
const projectController = require("../controllers/project.controller");
const authMiddleware = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
  createProjectSchema,
  updateProjectSchema,
} = require("../validators/project.validator");

// All project routes require authentication
router.use(authMiddleware);

// GET /api/projects
router.get("/", projectController.getProjects);

// GET /api/projects/:id
router.get("/:id", projectController.getProjectById);

// POST /api/projects
router.post("/", validate(createProjectSchema), projectController.createProject);

// PUT /api/projects/:id
router.put("/:id", validate(updateProjectSchema), projectController.updateProject);

// DELETE /api/projects/:id
router.delete("/:id", projectController.deleteProject);

module.exports = router;
