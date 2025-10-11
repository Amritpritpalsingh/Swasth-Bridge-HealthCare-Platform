const Joi = require("joi");

// ==================== Joi Schema for adding patient ====================
const addPatientSchema = Joi.object({
  pid: Joi.string().required().messages({
    "any.required": "Patient PID is required",
    "string.base": "PID must be a string"
  }),
  complain: Joi.string().required().messages({
    "any.required": "Complain field is required",
    "string.base": "Complain must be a string"
  }),
  diagnosis: Joi.string().required().messages({
    "any.required": "Diagnosis is required",
    "string.base": "Diagnosis must be a string"
  }),
  prescription: Joi.string().required().messages({
    "any.required": "Prescription is required",
    "string.base": "Prescription must be a string"
  }),
  paymentAmount: Joi.number().positive().required().messages({
    "any.required": "Payment amount is required",
    "number.base": "Payment amount must be a number",
    "number.positive": "Payment amount must be greater than 0"
  })
});

// ==================== Middleware ====================
exports.addPatient = (req, res, next) => {
  const { error } = addPatientSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details.map(d => d.message)
    });
  }

  next();
};
