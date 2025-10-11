const express = require("express");
const Router = express.Router();
const authController = require("../controller/authController");
const passport = require("passport");
// SIGNUP
Router.get("/signup", authController.signupPage);
Router.post("/signup", authController.signup);

// LOGIN
Router.get("/login", authController.loginPage);
Router.post("/login", authController.login);

// GOOGLE
Router.get("/google", authController.googleLogin);
Router.get("/google/callback",  passport.authenticate("google", { failureRedirect: "/sb/auth/login" }), authController.googleCallback);

// LOGOUT
Router.get("/logout", authController.logout);

module.exports = Router;
