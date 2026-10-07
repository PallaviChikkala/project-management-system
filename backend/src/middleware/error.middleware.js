const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

const errorHandler = (err, req, res, next) => {
  console.error("Unhandled Error:", err);

  // Prisma unique constraint violation (e.g. duplicate email)
  if (err.code === "P2002") {
    const target = err.meta?.target ? ` (${err.meta.target})` : "";
    return res.status(409).json({
      success: false,
      message: `A record with this unique field already exists${target}.`,
    });
  }

  // Prisma record not found
  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "The requested record was not found.",
    });
  }

  // Bad JSON payload
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON payload.",
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error occurred.";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
