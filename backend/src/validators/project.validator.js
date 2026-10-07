const { z } = require("zod");

const normalizeProjectStatus = (val) => {
  if (typeof val !== "string") return val;
  const upper = val.trim().toUpperCase().replace(/\s+/g, "_");
  return upper;
};

const projectStatusEnum = z.preprocess(
  normalizeProjectStatus,
  z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"], {
    errorMap: () => ({
      message: "Status must be 'NOT_STARTED', 'IN_PROGRESS', or 'COMPLETED'",
    }),
  })
);

const isValidDateString = (val) => {
  if (!val) return false;
  const d = new Date(val);
  return !isNaN(d.getTime());
};

const dateField = z
  .string({ required_error: "Date is required" })
  .refine(isValidDateString, { message: "Invalid date value" });

const createProjectSchema = z
  .object({
    name: z
      .string({ required_error: "Project name is required" })
      .trim()
      .min(1, "Project name is required")
      .max(150, "Project name cannot exceed 150 characters"),
    description: z.string().trim().optional().nullable(),
    status: projectStatusEnum.default("NOT_STARTED"),
    startDate: dateField,
    endDate: dateField,
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be greater than or equal to start date",
      path: ["endDate"],
    }
  );

const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Project name cannot be empty")
      .max(150, "Project name cannot exceed 150 characters")
      .optional(),
    description: z.string().trim().optional().nullable(),
    status: projectStatusEnum.optional(),
    startDate: z
      .string()
      .refine(isValidDateString, { message: "Invalid start date value" })
      .optional(),
    endDate: z
      .string()
      .refine(isValidDateString, { message: "Invalid end date value" })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be greater than or equal to start date",
      path: ["endDate"],
    }
  );

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  projectStatusEnum,
};
