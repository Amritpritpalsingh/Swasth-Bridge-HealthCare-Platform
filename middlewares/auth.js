function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/sb/auth/login");
}
module.exports = { isLoggedIn };
