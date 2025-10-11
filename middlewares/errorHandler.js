
module.exports = (err, req, res, next) => {
  console.error("🔥 Error:", err);

  // If response already started, hand over to Express
  if (res.headersSent) return next(err);

  // API vs. View distinction
  if (req.originalUrl.startsWith("/api") || req.xhr) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }

  // Fallback for views
  req.flash("error", err.message || "Something went wrong ❌");
  res.redirect("/sb/auth/login");
};