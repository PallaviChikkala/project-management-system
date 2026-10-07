const prisma = require("../config/prisma");

// GET /api/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Concurrently fetch counts for efficiency
    const [
      totalProjects,
      projectsInProgress,
      projectsCompleted,
      projectsNotStarted,
      totalTasks,
      completedTasks,
      pendingTasks,
      tasksInProgress,
      lowPriorityTasks,
      mediumPriorityTasks,
      highPriorityTasks,
      recentProjects,
      upcomingTasks,
    ] = await Promise.all([
      prisma.project.count({ where: { userId } }),
      prisma.project.count({ where: { userId, status: "IN_PROGRESS" } }),
      prisma.project.count({ where: { userId, status: "COMPLETED" } }),
      prisma.project.count({ where: { userId, status: "NOT_STARTED" } }),

      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: "COMPLETED" } }),
      prisma.task.count({ where: { userId, status: "PENDING" } }),
      prisma.task.count({ where: { userId, status: "IN_PROGRESS" } }),

      prisma.task.count({ where: { userId, priority: "LOW" } }),
      prisma.task.count({ where: { userId, priority: "MEDIUM" } }),
      prisma.task.count({ where: { userId, priority: "HIGH" } }),

      prisma.project.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          _count: {
            select: { tasks: true },
          },
        },
      }),

      prisma.task.findMany({
        where: {
          userId,
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const taskCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const projectCompletionRate =
      totalProjects > 0 ? Math.round((projectsCompleted / totalProjects) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        // Mandatory assessment metrics
        totalProjects,
        totalTasks,
        completedTasks,
        pendingTasks,
        projectsInProgress,

        // Additional rich analytics
        projectsNotStarted,
        projectsCompleted,
        tasksInProgress,
        taskCompletionRate,
        projectCompletionRate,
        priorityBreakdown: {
          low: lowPriorityTasks,
          medium: mediumPriorityTasks,
          high: highPriorityTasks,
        },
        recentProjects,
        upcomingTasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
