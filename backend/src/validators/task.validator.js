const { z } = require("zod");

const normalizeTaskPriority = (val) => {
  if (typeof val !== "string") return val;
  return val.trim().toUpperCase().replace(/\s+/g, "_");
};

const normalizeTaskStatus = (val) => {
  if (typeof val !== "string") return val;
  return val.trim().toUpperCase().replace(/\s+/g, "_");
};

const taskPriorityEnum = z.preprocess(
  normalizeTaskPriority,
  z.enum(["LOW", "MEDIUM", "HIGH"], {
    errorMap: () => ({
      message: "Priority must be 'LOW', 'MEDIUM', or 'HIGH'",
    }),
  })
);

const taskStatusEnum = z.preprocess(
  normalizeTaskStatus,
  z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"], {
    errorMap: () => ({
      message: "Status must be 'PENDING', 'IN_PROGRESS', or 'COMPLETED'",
    }),
  })
);

const isValidDateString = (val) => {
  if (!val) return false;
  const d = new Date(val);
  return !isNaN(d.getTime());
};

const createTaskSchema = z.object({
  projectId: z.coerce.number().int().positive("Valid projectId is required"),
  name: z
    .string({ required_error: "Task name is required" })
    .trim()
    .min(1, "Task name is required")
    .max(150, "Task name cannot exceed 150 characters"),
  description: z.string().trim().optional().nullable(),
  priority: taskPriorityEnum.default("MEDIUM"),
  status: taskStatusEnum.default("PENDING"),
  dueDate: z
    .string({ required_error: "Due date is required" })
    .refine(isValidDateString, { message: "Invalid due date value" }),
});

const updateTaskSchema = z.object({
  projectId: z.coerce.number().int().positive().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Task name cannot be empty")
    .max(150, "Task name cannot exceed 150 characters")
    .optional(),
  description: z.string().trim().optional().nullable(),
  priority: taskPriorityEnum.optional(),
  status: taskStatusEnum.optional(),
  dueDate: z
    .string()
    .refine(isValidDateString, { message: "Invalid due date value" })
    .optional(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  taskPriorityEnum,
  taskStatusEnum,
};
