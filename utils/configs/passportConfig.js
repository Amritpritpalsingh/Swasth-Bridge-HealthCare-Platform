const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

const Patient = require("../../models/patient");
const Doctor = require("../../models/doctor");
const Pharmacy = require("../../models/pharmacy");

module.exports = function (passport) {
  // -------------------------------
  // Local Strategy
  // -------------------------------
  passport.use(
    "local",
    new LocalStrategy(
      { usernameField: "email", passReqToCallback: true },
      async (req, email, password, done) => {
        try {
          const selectedRole = req.body.role; // role from hidden input
          let user;

          if (selectedRole === "Doctor") {
            user = await Doctor.findOne({ email });
          } else if (selectedRole === "Pharmacy") {
            user = await Pharmacy.findOne({ email });
          } else {
            user = await Patient.findOne({ email });
          }

          if (!user) return done(null, false, { message: "No user found" });

          const isMatch = await bcrypt.compare(password.trim(), user.password);
          if (!isMatch) return done(null, false, { message: "Wrong password" });

          user.role = selectedRole; // attach role to session
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // -------------------------------
  // Google Strategy
  // -------------------------------

passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const role = req.query.state || "Patient";
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
          const name = profile.displayName;
          const img = profile.photos?.[0]?.value;

          // 🧩 Step 1: Check if user already exists (any role)
          let existingUser =
            (await Doctor.findOne({ email })) ||
            (await Patient.findOne({ email })) ||
            (await Pharmacy.findOne({ email }));

          if (existingUser) {
            // ✅ If user exists, just log them in
            if (!existingUser.googleId) {
              existingUser.googleId = googleId; // link Google ID if missing
              await existingUser.save();
            }
            return done(null, existingUser);
          }

          // 🧩 Step 2: Create a new user based on role
          const userData = { googleId, name, email, img };
          let newUser;

          if (role === "Doctor") {
            newUser = await Doctor.create(userData);
          } else if (role === "Pharmacy") {
            newUser = await Pharmacy.create(userData);
          } else {
            newUser = await Patient.create(userData);
          }

          return done(null, newUser);
        } catch (err) {
          console.error("Google OAuth error:", err);
          return done(err, null);
        }
      }
    )
  );

  // -------------------------------
  // Serialize user
  // -------------------------------
  passport.serializeUser((user, done) => {
    done(null, { id: user.id, role: user.constructor.modelName });
  });

  // -------------------------------
  // Deserialize user
  // -------------------------------
  passport.deserializeUser(async (obj, done) => {
    try {
      let user;
      if (obj.role === "Doctor") {
        user = await Doctor.findById(obj.id);
      } else if (obj.role === "Pharmacy") {
        user = await Pharmacy.findById(obj.id);
      } else {
        user = await Patient.findById(obj.id);
      }

      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};

