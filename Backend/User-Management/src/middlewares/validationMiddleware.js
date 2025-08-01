const {body, validationResult} = require("express-validator");

// Allowed values
const roles = ["user", "merchant", "admin"];
const genders = ["Male", "Female", "Other"];
const ageGroups = ["18-25", "26-35", "36-50", "50+"];

// Register validation
const registerValidationRules = [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isLength({min: 6}).withMessage("Password must be at least 6 characters"),
    body("country").notEmpty().withMessage("Country is required"),
    body("age_group").isIn(ageGroups).withMessage("Invalid age group"),
    body("gender").isIn(genders).withMessage("Invalid gender"),
    body("travel_companion").notEmpty().withMessage("Travel companion is required"),
    body("budget").optional().notEmpty().withMessage("Budget is required"),
    body("location_types").isArray().withMessage("Location types must be an array"),
    body("preferred_activities").isArray().withMessage("Preferred activities must be an array"),
];

// Login validation
const loginValidationRules = [
    body("email").isEmail().withMessage("Invalid email"),
    body("password").notEmpty().withMessage("Password is required"),
];

// Profile update validation
const updateProfileValidationRules = [
    body("name").optional().notEmpty().withMessage("Name is required"),
    body("email").optional().isEmail().withMessage("Invalid email"),
    body("country").optional().notEmpty().withMessage("Country is required"),
    body("age_group").optional().isIn(ageGroups).withMessage("Invalid age group"),
    body("gender").optional().isIn(genders).withMessage("Invalid gender"),
    body("travel_companion").optional().notEmpty().withMessage("Travel companion is required"),
    body("budget").optional().notEmpty().withMessage("Budget is required"),
    body("location_types").optional().isArray().withMessage("Location types must be an array"),
    body("preferred_activities").optional().isArray().withMessage("Preferred activities must be an array"),
];

// Role update validation (admin only)
const updateRoleValidationRules = [
    body("role").isIn(roles).withMessage("Invalid role"),
];

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    const extractedErrors = [];
    errors.array().map((err) => extractedErrors.push({[err.param]: err.msg}));
    return res.status(422).json({errors: extractedErrors});
};

module.exports = {
    registerValidationRules,
    loginValidationRules,
    updateProfileValidationRules,
    updateRoleValidationRules,
    validate,
};
