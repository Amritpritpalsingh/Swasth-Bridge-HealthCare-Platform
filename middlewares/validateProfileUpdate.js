const Joi = require("joi");

const commonFields = {
  _id: Joi.string().required(),
  name: Joi.string().trim().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().trim().required(),
  gender: Joi.string().valid("Male", "Female", "Other").required(),
  dob: Joi.date().required(),
};

const doctorSchema = Joi.object({
  ...commonFields,
  specialty: Joi.string().trim().required(),
  consultationFee: Joi.number().positive().required(),
  consultationType: Joi.string().valid("Offline", "Online", "Both").required(),
  location: Joi.object({
    clinicName: Joi.string().trim().allow("").optional(),
    address: Joi.string().trim().allow("").optional(),
    city: Joi.string().trim().allow("").optional(),
    state: Joi.string().trim().allow("").optional(),
    pincode: Joi.string().trim().allow("").optional(),
  })
    .required()
    .custom((loc, helpers) => {
      // Require location fields if consultation type is offline/both
      if (["Offline", "Both"].includes(helpers.state.ancestors[0].consultationType)) {
        const missing = ["clinicName", "address", "city", "state", "pincode"].filter(
          (key) => !loc[key]
        );
        if (missing.length) {
          return helpers.error("any.custom", {
            message: `Missing clinic details: ${missing.join(", ")}`,
          });
        }
      }
      return loc;
    }),
  experience: Joi.number().min(0).required(),
  qualifications: Joi.string().trim().required(),
  registrationNumber: Joi.string().trim().required(),
  councilName: Joi.string().trim().required(),
  registrationYear: Joi.number().integer().required(),
  upiId: Joi.string()
    .pattern(/^[\w.-]+@[\w.-]+$/)
    .message("UPI ID must be in format username@bankname")
    .required(),
});

const patientSchema = Joi.object({
  ...commonFields,
  bloodGroup: Joi.string()
    .valid("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")
    .required(),
  address: Joi.object({
    street: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    pincode: Joi.string().trim().required(),
  }).required(),
});

/**
 * Middleware factory to validate profile updates
 * @param {"Doctor"|"Patient"} role
 */
const validateProfileUpdate = (role) => {
  return (req, res, next) => {
    try {
      const schema = role === "Doctor" ? doctorSchema : patientSchema;
      const { error } = schema.validate(req.body, { abortEarly: false });

      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          details: error.details.map((d) => d.message),
        });
      }

      // Optional image check (only validate type if uploaded)
      if (req.file) {
        if (!req.file.mimetype.startsWith("image/")) {
          return res.status(400).json({
            success: false,
            message: "Invalid file type — only images allowed",
          });
        }
      }

      next();
    } catch (err) {
      console.error("Profile validation error:", err);
      return res.status(500).json({
        success: false,
        message: "Internal validation error",
      });
    }
  };
};

module.exports = validateProfileUpdate;
