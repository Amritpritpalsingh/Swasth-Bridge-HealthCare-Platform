const bcrypt = require("bcryptjs");
const passport = require("passport");
const Doctor = require("../models/doctor");
const Patient = require("../models/patient");
const Pharmacy = require("../models/pharmacy");
const catchAsync = require("../utils/catchAsync");

// ===== SIGNUP =====
exports.signupPage = (req, res) => {
  res.render("registertion/sign.ejs");
};

exports.signup = catchAsync(async (req, res, next) => {
  const { role, name, pharmacyName, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    req.flash("error", "Passwords do not match ❌");
    return res.redirect("/sb/auth/signup");
  }

  const existingUser =
    (await Doctor.findOne({ email })) ||
    (await Pharmacy.findOne({ email })) ||
    (await Patient.findOne({ email }));

  if (existingUser) {
    req.flash("error", "Email already registered ⚠️");
    return res.redirect("/sb/auth/signup");
  }

  const hashedPassword = await bcrypt.hash(password.trim(), 10);

  let user;
  if (role === "Doctor") {
    user = new Doctor({ name, email, password: hashedPassword, role });
  } else if (role === "Pharmacy") {
    user = new Pharmacy({ pharmacyName, email, password: hashedPassword, role });
  } else {
    user = new Patient({ name, email, password: hashedPassword, role });
  }

  await user.save();

  req.login(user, (err) => {
    if (err) return next(err);
    req.flash("success", "Account created successfully 🎉");
    if (role === "Doctor") return res.redirect("/sb/doc/dashboard");
    if (role === "Patient") return res.redirect("/sb/pat/dashboard");
    res.redirect("/");
  });
});

// ===== LOGIN =====
exports.loginPage = (req, res) => {
  res.render("registertion/login.ejs");
};

exports.login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash("error", info.message || "Invalid credentials ❌");
      return res.redirect("/sb/auth/login");
    }

    req.logIn(user, (err) => {
      if (err) return next(err);
      if (user.role === "Doctor") {
        req.flash("success", `Welcome back Dr.${user.name}! 🎉`);
        return res.redirect("/sb/doc/dashboard");
      } else if (user.role === "Patient") {
        req.flash("success", `Welcome back, ${user.name}! 🎉`);
        return res.redirect("/sb/pat/dashboard");
      }
        res.redirect("/sb/auth/login");
    });
  })(req, res, next);
};

// ===== GOOGLE LOGIN =====
exports.googleLogin = (req, res, next) => {
  const role = req.query.role || "Patient";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: role,
  })(req, res, next);
};

exports.googleCallback = (req, res) => {
  if (!req.user) {
    req.flash("error", "Google login failed ❌");
    return res.redirect("/sb/auth/login");
  }

  // Redirect based on user role
  const role = req.user.constructor.modelName;
  if (role === "Doctor") return res.redirect("/sb/doc/dashboard");
  if (role === "Pharmacy") return res.redirect("/sb/pharmacy/dashboard");
  return res.redirect("/sb/pat/dashboard");
};
// ===== LOGOUT =====
exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Logged out successfully 👋");
    res.redirect("/sb/auth/login");
  });
};
