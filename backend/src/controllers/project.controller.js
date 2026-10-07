const prisma = require("../config/prisma");

const normalizeProjectStatus = (val) => {
  if (!val || typeof val !== "string") return undefined;
  const upper = val.trim().toUpperCase().replace(/\s+/g, "_");
  if (["NOT_STARTED", "IN_PROGRESS", "COMPLETED"].includes(upper)) {
    return upper;
  }
  return undefined;
};

// GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search, status, sortBy = "createdAt", order = "desc" } = req.query;

    const where = {
      userId,
    };

    if (search && search.trim() !== "") {
      where.name = {
        contains: search.trim(),
      };
    }

    const normalizedStatus = normalizeProjectStatus(status);
    if (normalizedStatus) {
      where.status = normalizedStatus;
    }

    const validSortFields = ["createdAt", "updatedAt", "name", "startDate", "endDate", "status"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order.toLowerCase() === "asc" ? "asc" : "desc";

    const projects = await prisma.project.findMany({
      where,
      orderBy: {
        [sortField]: sortOrder,
      },
      include: {
        _count: {
          select: { tasks: true },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // Add task progress metrics to each project
    const formattedProjects = projects.map((p) => {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter((t) => t.status === "COMPLETED").length;
      const { tasks, ...rest } = p;
      return {
        ...rest,
        tasksCount: totalTasks,
        completedTasksCount: completedTasks,
        progressPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedProjects,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/projects/:id
const getProjectById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.id, 10);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      include: {
        tasks: {
          orderBy: {
            dueDate: "asc",
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you do not have permission to access it.",
      });
    }

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t) => t.status === "COMPLETED").length;
    const pendingTasks = project.tasks.filter((t) => t.status === "PENDING").length;
    const inProgressTasks = project.tasks.filter((t) => t.status === "IN_PROGRESS").length;

    res.status(200).json({
      success: true,
      data: {
        ...project,
        tasksCount: totalTasks,
        completedTasksCount: completedTasks,
        pendingTasksCount: pendingTasks,
        inProgressTasksCount: inProgressTasks,
        progressPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, description, status, startDate, endDate } = req.body;

    const project = await prisma.project.create({
      data: {
        userId,
        name,
        description: description || null,
        status: status || "NOT_STARTED",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.id, 10);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you do not have permission to modify it.",
      });
    }

    const { name, description, status, startDate, endDate } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (status !== undefined) updateData.status = status;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.id, 10);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you do not have permission to delete it.",
      });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
