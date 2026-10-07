const prisma = require("../config/prisma");

const normalizeTaskPriority = (val) => {
  if (!val || typeof val !== "string") return undefined;
  const upper = val.trim().toUpperCase().replace(/\s+/g, "_");
  if (["LOW", "MEDIUM", "HIGH"].includes(upper)) {
    return upper;
  }
  return undefined;
};

const normalizeTaskStatus = (val) => {
  if (!val || typeof val !== "string") return undefined;
  const upper = val.trim().toUpperCase().replace(/\s+/g, "_");
  if (["PENDING", "IN_PROGRESS", "COMPLETED"].includes(upper)) {
    return upper;
  }
  return undefined;
};

// GET /api/tasks
const getTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      projectId,
      search,
      status,
      priority,
      sortBy = "dueDate",
      order = "asc",
    } = req.query;

    const where = {
      userId,
    };

    if (projectId) {
      const pid = parseInt(projectId, 10);
      if (!isNaN(pid)) {
        where.projectId = pid;
      }
    }

    if (search && search.trim() !== "") {
      where.name = {
        contains: search.trim(),
      };
    }

    const normalizedStatus = normalizeTaskStatus(status);
    if (normalizedStatus) {
      where.status = normalizedStatus;
    }

    const normalizedPriority = normalizeTaskPriority(priority);
    if (normalizedPriority) {
      where.priority = normalizedPriority;
    }

    const validSortFields = ["dueDate", "createdAt", "updatedAt", "name", "priority", "status"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "dueDate";
    const sortOrder = order.toLowerCase() === "desc" ? "desc" : "asc";

    const tasks = await prisma.task.findMany({
      where,
      orderBy: {
        [sortField]: sortOrder,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/:id
const getTaskById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or you do not have permission to access it.",
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId, name, description, priority, status, dueDate } = req.body;

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Selected project not found or does not belong to you.",
      });
    }

    const task = await prisma.task.create({
      data: {
        userId,
        projectId,
        name,
        description: description || null,
        priority: priority || "MEDIUM",
        status: status || "PENDING",
        dueDate: new Date(dueDate),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully.",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found or you do not have permission to modify it.",
      });
    }

    const { projectId, name, description, priority, status, dueDate } = req.body;
    const updateData = {};

    if (projectId !== undefined) {
      const targetProject = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId,
        },
      });

      if (!targetProject) {
        return res.status(404).json({
          success: false,
          message: "Target project not found or does not belong to you.",
        });
      }
      updateData.projectId = projectId;
    }

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Task updated successfully.",
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found or you do not have permission to delete it.",
      });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    res.status(200).json({
      success: true,
      message: "Task deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
