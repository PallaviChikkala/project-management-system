const validate = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req[source]);
      if (!parsed.success) {
        // Collect readable errors
        const formattedErrors = parsed.error.issues
          ? parsed.error.issues.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            }))
          : parsed.error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            }));

        return res.status(400).json({
          success: false,
          message: formattedErrors[0]?.message || "Validation failed",
          errors: formattedErrors,
        });
      }

      req[source] = parsed.data;
      next();
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid request payload",
        error: err.message,
      });
    }
  };
};

module.exports = validate;
